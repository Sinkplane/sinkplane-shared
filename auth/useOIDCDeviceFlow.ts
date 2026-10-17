import { useState, useEffect, useRef, useCallback } from 'react';

import { OIDC_CLIENT_ID, OIDC_SCOPE, OIDC_DEVICE_AUTH_ENDPOINT, OIDC_TOKEN_ENDPOINT } from '../constants/api';

export interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType?: string;
}

export type OIDCStatus = 'idle' | 'requesting' | 'polling' | 'success' | 'error' | 'expired';

export interface OIDCDeviceFlowState {
  status: OIDCStatus;
  userCode: string | null;
  verificationUri: string | null;
  verificationUriComplete: string | null;
  expiresAt: number | null;
  errorMessage: string | null;
  tokenResponse: TokenResponse | null;
}

export function useOIDCDeviceFlow() {
  const [state, setState] = useState<OIDCDeviceFlowState>({
    status: 'idle',
    userCode: null,
    verificationUri: null,
    verificationUriComplete: null,
    expiresAt: null,
    errorMessage: null,
    tokenResponse: null,
  });

  const deviceCodeRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const pollForToken = useCallback(async () => {
    if (!deviceCodeRef.current || isCancelledRef.current) return;

    try {
      const body = new URLSearchParams();
      body.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
      body.append('client_id', OIDC_CLIENT_ID);
      body.append('device_code', deviceCodeRef.current);

      const response = await fetch(OIDC_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (isCancelledRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();

      if (data.error) {
        if (data.error === 'authorization_pending') {
          return;
        } else if (data.error === 'slow_down') {
          return;
        } else if (data.error === 'expired_token') {
          cleanup();
          setState(prev => ({
            ...prev,
            status: 'expired',
            errorMessage: 'Login code expired. Please try again.',
          }));
          return;
        } else {
          cleanup();
          setState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: `Login failed: ${data.error}`,
          }));
          return;
        }
      }

      cleanup();
      const tokenResponse: TokenResponse = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type,
      };
      setState(prev => ({
        ...prev,
        status: 'success',
        tokenResponse,
      }));
    } catch {
      // Transient error, keep polling
    }
  }, [cleanup]);

  const startFlow = useCallback(async () => {
    isCancelledRef.current = false;
    cleanup();

    setState({
      status: 'requesting',
      userCode: null,
      verificationUri: null,
      verificationUriComplete: null,
      expiresAt: null,
      errorMessage: null,
      tokenResponse: null,
    });

    try {
      const body = new URLSearchParams();
      body.append('client_id', OIDC_CLIENT_ID);
      body.append('scope', OIDC_SCOPE);

      const response = await fetch(OIDC_DEVICE_AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (isCancelledRef.current) return;

      if (!response.ok) {
        const errorText = await response.text();
        setState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: `Failed to start device login: ${response.status} - ${errorText}`,
        }));
        return;
      }

      const data: DeviceAuthResponse = await response.json();

      if (isCancelledRef.current) return;

      deviceCodeRef.current = data.device_code;
      const expiresAt = Date.now() + data.expires_in * 1000;
      const interval = (data.interval || 5) * 1000;

      setState({
        status: 'polling',
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        verificationUriComplete: data.verification_uri_complete,
        expiresAt,
        errorMessage: null,
        tokenResponse: null,
      });

      pollIntervalRef.current = setInterval(() => {
        pollForToken();
      }, interval);

      timerIntervalRef.current = setInterval(() => {
        if (Date.now() >= expiresAt) {
          cleanup();
          setState(prev => ({
            ...prev,
            status: 'expired',
            errorMessage: 'Login code expired. Please try again.',
          }));
        }
      }, 1000);
    } catch (error) {
      if (isCancelledRef.current) return;
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to start device login',
      }));
    }
  }, [cleanup, pollForToken]);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    cleanup();
    deviceCodeRef.current = null;
    setState({
      status: 'idle',
      userCode: null,
      verificationUri: null,
      verificationUriComplete: null,
      expiresAt: null,
      errorMessage: null,
      tokenResponse: null,
    });
  }, [cleanup]);

  useEffect(
    () => () => {
      isCancelledRef.current = true;
      cleanup();
    },
    [cleanup],
  );

  return {
    ...state,
    startFlow,
    cancel,
  };
}
