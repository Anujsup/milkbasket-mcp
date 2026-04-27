export const GRAPHQL_ENDPOINT = "https://consumerbff.milkbasket.com/graphql";

export const APP_VERSION = "8.0.8.0";
export const BINARY_VERSION = "8.0.8";
export const APP_PLATFORM = "web";

/** Default city/hub used before the user logs in */
export const DEFAULT_CITY_ID = "54";
export const DEFAULT_HUB_ID = "93";

/** Shared base headers sent with every request */
export const BASE_HEADERS: Record<string, string> = {
  accept: "*/*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
  "content-type": "application/json",
  appplatform: APP_PLATFORM,
  appversion: APP_VERSION,
  binaryversion: BINARY_VERSION,
  mbexpress: "0",
  mblitetype: "0",
  Referer: "https://www.milkbasket.com/",
};

export const KEYCHAIN_SERVICE = "milkbasket-mcp";
export const KEYCHAIN_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  TOKEN_META: "token_meta",
} as const;

export const FALLBACK_TOKEN_DIR = ".milkbasket-mcp";
export const FALLBACK_TOKEN_FILE = "tokens.json";
