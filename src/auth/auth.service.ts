import { gqlRequest } from "../graphql/client.js";
import {
  VERIFY_NUMBER_MUTATION,
  LOGIN_MUTATION,
  FETCH_USER_DETAILS_QUERY,
} from "../graphql/queries.js";
import { saveTokens, clearTokens, getAccessToken, getTokenMeta, isAuthenticated } from "./token.store.js";
import { APP_VERSION, BINARY_VERSION, DEFAULT_CITY_ID, DEFAULT_HUB_ID } from "../config/constants.js";

// ─── Response shapes ──────────────────────────────────────────────────────────

interface VerifyNumberResponse {
  verifyPhoneNumber: {
    status: boolean;
    error: string | null;
    errorMsg: string;
    otpBlockTime: number;
  };
}

interface LoginResponse {
  login: {
    status: boolean;
    authExpiry: number | null;
    authKey: string | null;
    errorMsg: string;
    refreshKey: string | null;
  };
}

interface UserDetailsResponse {
  getUserDetails: {
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      address: {
        cityId: string;
        cityName: string;
        hubId: string;
        fullAddress: string;
      } | null;
    };
  };
}

// ─── Request OTP ──────────────────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<{
  success: boolean;
  message: string;
  otpBlockTime?: number;
}> {
  const data = await gqlRequest<VerifyNumberResponse>(
    VERIFY_NUMBER_MUTATION,
    {
      phone,
      retry: false,
      retryType: "",
      appHash: "#MilkBasketMCP",
      udid: `mcp-${Date.now()}`,
    },
    { operationName: "verifyNumber", requiresAuth: false }
  );

  const result = data.verifyPhoneNumber;

  if (!result.status) {
    return {
      success: false,
      message: result.errorMsg || "Failed to send OTP. Please try again.",
    };
  }

  return {
    success: true,
    message: `OTP sent successfully to ${phone}. It will expire in ${result.otpBlockTime} seconds.`,
    otpBlockTime: result.otpBlockTime,
  };
}

// ─── Verify OTP & login ───────────────────────────────────────────────────────

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{
  success: boolean;
  message: string;
  user?: { name: string; phone: string; cityId: string; hubId: string };
}> {
  const data = await gqlRequest<LoginResponse>(
    LOGIN_MUTATION,
    {
      phone,
      otp,
      appVersion: APP_VERSION,
      binaryVersion: BINARY_VERSION,
      source: "web",
      deviceDetail: {
        udid: `mcp-${Date.now()}`,
        deviceModel: "unknown",
        isVirtual: false,
        manufacturer: "unknown",
        platform: "web",
        androidVersion: 0,
        advertisingId: "",
        tracking: false,
      },
    },
    { operationName: "login", requiresAuth: false }
  );

  const result = data.login;

  if (!result.status || !result.authKey || !result.refreshKey) {
    return {
      success: false,
      message: result.errorMsg || "Login failed. Please check your OTP and try again.",
    };
  }

  // authExpiry is in minutes — convert to absolute timestamp
  const expiresAt = Date.now() + (result.authExpiry ?? 1440) * 60 * 1000;

  // Temporarily save just the access token so we can call fetchUserDetails
  await saveTokens({
    accessToken: result.authKey,
    refreshToken: result.refreshKey,
    meta: {
      phone,
      cityId: DEFAULT_CITY_ID,
      hubId: DEFAULT_HUB_ID,
      expiresAt,
    },
  });

  // Fetch user details to get the real cityId / hubId
  let cityId = DEFAULT_CITY_ID;
  let hubId = DEFAULT_HUB_ID;
  let userName = "";

  try {
    const userDetails = await gqlRequest<UserDetailsResponse>(
      FETCH_USER_DETAILS_QUERY,
      {},
      { operationName: "fetchUserDetails", requiresAuth: true }
    );
    const user = userDetails.getUserDetails.user;
    userName = user.name;
    if (user.address) {
      cityId = String(user.address.cityId);
      hubId = String(user.address.hubId);
    }
  } catch {
    // Non-fatal: proceed with defaults
  }

  // Persist final meta with real city/hub
  await saveTokens({
    accessToken: result.authKey,
    refreshToken: result.refreshKey,
    meta: { phone, cityId, hubId, expiresAt },
  });

  return {
    success: true,
    message: `Logged in successfully${userName ? ` as ${userName}` : ""}.`,
    user: { name: userName, phone, cityId, hubId },
  };
}

// ─── Auth status ──────────────────────────────────────────────────────────────

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  message: string;
  phone?: string;
  expiresAt?: string;
}> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    const token = await getAccessToken();
    if (!token) {
      return { authenticated: false, message: "Not logged in." };
    }
    const meta = await getTokenMeta();
    if (meta && Date.now() >= meta.expiresAt) {
      return {
        authenticated: false,
        message: "Session expired. Please log in again.",
        phone: maskPhone(meta.phone),
      };
    }
    return { authenticated: false, message: "Not logged in." };
  }

  const meta = await getTokenMeta();
  return {
    authenticated: true,
    message: `Logged in as ${maskPhone(meta!.phone)}`,
    phone: maskPhone(meta!.phone),
    expiresAt: new Date(meta!.expiresAt).toISOString(),
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<{ success: boolean; message: string }> {
  const meta = await getTokenMeta();
  await clearTokens();
  return {
    success: true,
    message: meta
      ? `Logged out ${maskPhone(meta.phone)} successfully.`
      : "Logged out successfully.",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  if (phone.length < 4) return "****";
  return `****${phone.slice(-4)}`;
}
