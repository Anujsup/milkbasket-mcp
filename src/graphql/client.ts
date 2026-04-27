import {
  GRAPHQL_ENDPOINT,
  BASE_HEADERS,
  DEFAULT_CITY_ID,
  DEFAULT_HUB_ID,
} from "../config/constants.js";
import { getTokenMeta, getAccessToken } from "../auth/token.store.js";

// ─── Errors ───────────────────────────────────────────────────────────────────

export class AuthRequiredError extends Error {
  constructor() {
    super(
      "Authentication required. Please log in first using auth_request_otp then auth_verify_otp."
    );
    this.name = "AuthRequiredError";
  }
}

export class GraphQLError extends Error {
  constructor(
    public readonly errors: Array<{ message: string }>,
    public readonly operationName?: string
  ) {
    super(
      `GraphQL error${operationName ? ` in ${operationName}` : ""}: ${errors
        .map((e) => e.message)
        .join("; ")}`
    );
    this.name = "GraphQLError";
  }
}

// ─── Header builder ──────────────────────────────────────────────────────────

async function buildHeaders(requiresAuth: boolean): Promise<Record<string, string>> {
  if (!requiresAuth) {
    return {
      ...BASE_HEADERS,
      authorization: "",
      cityid: DEFAULT_CITY_ID,
      hubid: DEFAULT_HUB_ID,
      role: "1",
    };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) throw new AuthRequiredError();

  const meta = await getTokenMeta();
  const cityId = meta?.cityId ?? DEFAULT_CITY_ID;
  const hubId = meta?.hubId ?? DEFAULT_HUB_ID;

  return {
    ...BASE_HEADERS,
    authorization: `Bearer ${accessToken}`,
    cityid: cityId,
    hubid: hubId,
    role: "0",
  };
}

// ─── Core request ─────────────────────────────────────────────────────────────

export interface GQLRequestOptions {
  operationName?: string;
  requiresAuth: boolean;
}

export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  options: GQLRequestOptions
): Promise<T> {
  const headers = await buildHeaders(options.requiresAuth);

  const body = JSON.stringify({
    operationName: options.operationName,
    variables,
    query,
  });

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} for operation "${options.operationName}"`
    );
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new GraphQLError(json.errors, options.operationName);
  }

  if (json.data === undefined) {
    throw new Error(`No data returned for operation "${options.operationName}"`);
  }

  return json.data;
}
