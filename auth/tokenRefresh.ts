import { OIDC_CLIENT_ID, OIDC_TOKEN_ENDPOINT } from '../constants/api';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

/**
 * Refresh an access token using a refresh token via the OIDC token endpoint.
 * Uses the standard refresh_token grant type.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResult> {
  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('client_id', OIDC_CLIENT_ID);
  body.append('refresh_token', refreshToken);

  const response = await fetch(OIDC_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Token refresh error: ${data.error} - ${data.error_description || ''}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Some providers rotate, some don't
    expiresIn: data.expires_in || 1800,
    tokenType: data.token_type,
  };
}

/**
 * Check if a token is expired or about to expire.
 * @param tokenExpiration ISO date string of token expiration
 * @param bufferMinutes Minutes before expiration to consider "about to expire" (default: 5)
 */
export function isTokenExpiringSoon(tokenExpiration?: string | null, bufferMinutes: number = 5): boolean {
  if (!tokenExpiration) return true;

  const expirationDate = new Date(tokenExpiration);
  const bufferMs = bufferMinutes * 60 * 1000;
  const now = new Date();

  return now.getTime() + bufferMs >= expirationDate.getTime();
}

/**
 * Check if a token is already expired.
 */
export function isTokenExpired(tokenExpiration?: string | null): boolean {
  if (!tokenExpiration) return true;

  const expirationDate = new Date(tokenExpiration);
  return new Date().getTime() >= expirationDate.getTime();
}
