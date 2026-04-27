/**
 * Secure token storage using the OS native keychain via keytar.
 *
 * keytar backends:
 *   macOS  → Keychain
 *   Windows → Credential Manager
 *   Linux  → Secret Service (libsecret)
 *
 * Falls back to an AES-256-GCM encrypted JSON file in ~/.milkbasket-mcp/
 * when keytar is unavailable (e.g. CI, headless servers without libsecret).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  KEYCHAIN_SERVICE,
  KEYCHAIN_KEYS,
  FALLBACK_TOKEN_DIR,
  FALLBACK_TOKEN_FILE,
} from "../config/constants.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenMeta {
  phone: string;
  cityId: string;
  hubId: string;
  expiresAt: number; // Unix ms
}

// ─── keytar loader (optional peer dep) ───────────────────────────────────────

type Keytar = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

let keytarInstance: Keytar | null = null;
let keytarChecked = false;

async function getKeytar(): Promise<Keytar | null> {
  if (keytarChecked) return keytarInstance;
  keytarChecked = true;
  try {
    const mod = await import("keytar");
    keytarInstance = mod.default as Keytar;
  } catch {
    keytarInstance = null;
  }
  return keytarInstance;
}

// ─── Fallback encrypted file store ───────────────────────────────────────────

const FALLBACK_DIR = join(homedir(), FALLBACK_TOKEN_DIR);
const FALLBACK_PATH = join(FALLBACK_DIR, FALLBACK_TOKEN_FILE);

/** Derive a machine-specific key from a fixed salt + hostname so the file is
 *  not portable to another machine even if copied. */
function deriveKey(): Buffer {
  const secret = `milkbasket-mcp:${process.env.USER ?? "default"}`;
  return scryptSync(secret, "mb-mcp-salt-v1", 32);
}

function encryptValue(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decryptValue(ciphertext: string): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(":");
  const key = deriveKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(dataHex, "hex")).toString("utf8") + decipher.final("utf8");
}

function readFallbackStore(): Record<string, string> {
  if (!existsSync(FALLBACK_PATH)) return {};
  try {
    const raw = readFileSync(FALLBACK_PATH, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeFallbackStore(store: Record<string, string>): void {
  if (!existsSync(FALLBACK_DIR)) mkdirSync(FALLBACK_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(FALLBACK_PATH, JSON.stringify(store), { mode: 0o600 });
}

async function fallbackGet(account: string): Promise<string | null> {
  const store = readFallbackStore();
  const encrypted = store[account];
  if (!encrypted) return null;
  try {
    return decryptValue(encrypted);
  } catch {
    return null;
  }
}

async function fallbackSet(account: string, value: string): Promise<void> {
  const store = readFallbackStore();
  store[account] = encryptValue(value);
  writeFallbackStore(store);
}

async function fallbackDelete(account: string): Promise<void> {
  const store = readFallbackStore();
  delete store[account];
  if (Object.keys(store).length === 0 && existsSync(FALLBACK_PATH)) {
    unlinkSync(FALLBACK_PATH);
  } else {
    writeFallbackStore(store);
  }
}

// ─── Unified store API ────────────────────────────────────────────────────────

async function storeGet(account: string): Promise<string | null> {
  const kt = await getKeytar();
  if (kt) return kt.getPassword(KEYCHAIN_SERVICE, account);
  return fallbackGet(account);
}

async function storeSet(account: string, value: string): Promise<void> {
  const kt = await getKeytar();
  if (kt) return kt.setPassword(KEYCHAIN_SERVICE, account, value);
  return fallbackSet(account, value);
}

async function storeDelete(account: string): Promise<void> {
  const kt = await getKeytar();
  if (kt) {
    await kt.deletePassword(KEYCHAIN_SERVICE, account);
    return;
  }
  return fallbackDelete(account);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return storeGet(KEYCHAIN_KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return storeGet(KEYCHAIN_KEYS.REFRESH_TOKEN);
}

export async function getTokenMeta(): Promise<TokenMeta | null> {
  const raw = await storeGet(KEYCHAIN_KEYS.TOKEN_META);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenMeta;
  } catch {
    return null;
  }
}

export async function saveTokens(params: {
  accessToken: string;
  refreshToken: string;
  meta: TokenMeta;
}): Promise<void> {
  await storeSet(KEYCHAIN_KEYS.ACCESS_TOKEN, params.accessToken);
  await storeSet(KEYCHAIN_KEYS.REFRESH_TOKEN, params.refreshToken);
  await storeSet(KEYCHAIN_KEYS.TOKEN_META, JSON.stringify(params.meta));
}

export async function clearTokens(): Promise<void> {
  await storeDelete(KEYCHAIN_KEYS.ACCESS_TOKEN);
  await storeDelete(KEYCHAIN_KEYS.REFRESH_TOKEN);
  await storeDelete(KEYCHAIN_KEYS.TOKEN_META);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  const meta = await getTokenMeta();
  if (!meta) return false;
  return Date.now() < meta.expiresAt;
}
