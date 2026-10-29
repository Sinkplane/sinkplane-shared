import { API_BASE_URL } from '../constants/api';
import { User } from '../types/user.interface';
import { BROWSER_USER_AGENT } from './apiClient';

/**
 * Floatplane username/password auth (the floatplane.com/login flow).
 *
 * Sequence (mirrors the web client):
 *  1. getCaptchaInfo()            — check whether a Cloudflare Turnstile
 *                                    challenge is required and fetch its siteKey
 *  2. solve Turnstile (managed)   — done by the app UI, produces captchaToken
 *  3. loginWithPassword(...)      — POST /api/v3/auth/login with
 *                                    returnSessionToken: true
 *  4. if needs2FA: checkFor2faLogin(token, code)
 *                                    — POST /api/v3/auth/checkFor2faLogin
 *  5. the returned session token is used as `Authorization: Bearer` for all
 *     API v3 calls (same as Floatplane's own native apps).
 *
 * Requests must carry a browser User-Agent (Cloudflare) — see apiClient.
 */

/** Error shapes returned by Floatplane API v3: {id, message, errors?: [{id, name, message}]}. */
interface ApiErrorBody {
  id?: string;
  message?: string;
  errors?: Array<{ id?: string; name?: string; message?: string }>;
}

export class FloatplaneApiError extends Error {
  readonly status: number;
  /** Service error name, e.g. 'invalidCaptchaTokenError' or 'emailNotConfirmedError'. */
  readonly errorName: string;

  constructor(message: string, status: number, errorName: string) {
    super(message);
    this.name = 'FloatplaneApiError';
    this.status = status;
    this.errorName = errorName;
  }
}

async function parseError(response: Response): Promise<FloatplaneApiError> {
  let message = `Request failed with status ${response.status}`;
  let errorName = 'requestFailedError';
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.message) message = body.message;
    errorName = body.errors?.[0]?.name ?? errorName;
  } catch {
    // Non-JSON body (e.g. a Cloudflare challenge page) — keep defaults.
  }
  return new FloatplaneApiError(message, response.status, errorName);
}

async function apiFetch(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': BROWSER_USER_AGENT,
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response;
}

export interface CaptchaVariantInfo {
  siteKey: string;
}

export interface CaptchaInfo {
  v2?: { variants?: { android?: CaptchaVariantInfo; checkbox?: CaptchaVariantInfo; invisible?: CaptchaVariantInfo } };
  v3?: { variants?: { android?: CaptchaVariantInfo; checkbox?: CaptchaVariantInfo; invisible?: CaptchaVariantInfo } };
  turnstile?: { variants?: { managed?: CaptchaVariantInfo; 'non-interactive'?: CaptchaVariantInfo; invisible?: CaptchaVariantInfo } };
}

/**
 * GET /api/v3/auth/captcha/info — which captcha variants are currently
 * enforced. The web client uses `turnstile.variants.managed.siteKey` when
 * present; when it is absent, captcha is disabled and login proceeds without
 * a captchaToken.
 */
export async function getCaptchaInfo(): Promise<CaptchaInfo> {
  const response = await apiFetch('/api/v3/auth/captcha/info', { method: 'GET' });
  return response.json();
}

export interface LoginResponse {
  /** Present once login fully succeeded (no 2FA pending). */
  user?: User;
  /** True when a 2FA code must be submitted via checkFor2faLogin before the session is usable. */
  needs2FA: boolean;
  /** Session token (set because we send returnSessionToken: true). Usable as Bearer. */
  token?: string;
}

/**
 * POST /api/v3/auth/login — username/password sign-in with the Cloudflare
 * Turnstile token. Mirrors the web client, including returnSessionToken so the
 * response carries a Bearer-able session token for native use.
 */
export async function loginWithPassword(username: string, password: string, captchaToken?: string): Promise<LoginResponse> {
  const response = await apiFetch('/api/v3/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: username.trim(),
      password,
      captchaToken,
      returnSessionToken: true,
    }),
  });
  return response.json();
}

/**
 * POST /api/v3/auth/checkFor2faLogin — submit the 2FA code for a login that
 * returned needs2FA. `token` is the session token from the login response;
 * `code` is a 6-digit code or a backup code (xxxxxx-xxxxxx).
 */
export async function checkFor2faLogin(token: string, code: string): Promise<void> {
  await apiFetch('/api/v3/auth/checkFor2faLogin', {
    method: 'POST',
    body: JSON.stringify({ token: code.replace(/\s/g, '') }),
  }, token);
}

/** POST /api/v3/auth/logout — invalidate the session token server-side. */
export async function logout(token: string): Promise<void> {
  await apiFetch('/api/v3/auth/logout', { method: 'POST' }, token);
}
