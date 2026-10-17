import { API_BASE_URL } from '../constants/api';

type RefreshCallback = () => Promise<string | null>;

// Module-level state for the refresh callback (registered by SessionProvider)
let refreshCallback: RefreshCallback | null = null;

// In-flight refresh promise to deduplicate concurrent 401 retries
let refreshInProgress: Promise<string | null> | null = null;

/**
 * Register the refresh callback from the auth context.
 * Called once by SessionProvider on mount.
 */
export function registerRefreshCallback(cb: RefreshCallback) {
  refreshCallback = cb;
}

/**
 * Unregister the refresh callback on sign-out.
 */
export function unregisterRefreshCallback() {
  refreshCallback = null;
  refreshInProgress = null;
}

/**
 * Get the current refresh callback (for use by the API client).
 */
function getRefreshCallback(): RefreshCallback | null {
  return refreshCallback;
}

/**
 * Attempt to refresh the token, deduplicating concurrent requests.
 */
async function attemptRefresh(): Promise<string | null> {
  // If a refresh is already in progress, piggyback on it
  if (refreshInProgress) {
    return refreshInProgress;
  }

  const cb = getRefreshCallback();
  if (!cb) {
    return null;
  }

  refreshInProgress = cb();
  try {
    return await refreshInProgress;
  } finally {
    refreshInProgress = null;
  }
}

export interface AuthenticatedFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /**
   * If true, automatically attach the Bearer token.
   * @default true
   */
  auth?: boolean;
}

/**
 * Drop-in replacement for `fetch()` that:
 * 1. Prepends the API_BASE_URL for relative URLs
 * 2. Attaches the Bearer Authorization header
 * 3. On 401, attempts to refresh the token and retries once
 *
 * @param url - Full URL or path relative to API_BASE_URL
 * @param token - Current access token
 * @param options - Fetch options
 */
export async function authenticatedFetch(url: string, token: string, options: AuthenticatedFetchOptions = {}): Promise<Response> {
  const { auth = true, headers: customHeaders = {}, ...restOptions } = options;

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // If we have a token and auth is enabled
  if (auth && token) {
    // If the token starts with 'ey', it's a JWT — use Bearer auth
    if (token.startsWith('ey')) {
      headers.Authorization = `Bearer ${token}`;
    }
    // If it's not a JWT, it's likely a sails.sid cookie from the companion app.
    // We set this cookie in CookieManager, but we can also pass it explicitly
    // or rely on credentials: 'include' if the fetch implementation supports it.
  }

  let response = await fetch(fullUrl, {
    ...restOptions,
    headers,
    credentials: 'include', // Ensure cookies are sent (especially important for sails.sid)
  });

  // On 401, attempt token refresh and retry once
  if (auth && response.status === 401 && getRefreshCallback()) {
    // eslint-disable-next-line no-console
    console.info('[ApiClient] Received 401, attempting token refresh...');
    const newToken = await attemptRefresh();

    if (newToken) {
      // eslint-disable-next-line no-console
      console.info('[ApiClient] Token refreshed, retrying request...');
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(fullUrl, {
        ...restOptions,
        headers,
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('[ApiClient] Token refresh failed on 401');
    }
  }

  return response;
}
