import { use, createContext, PropsWithChildren, useState, useEffect, useRef, useCallback } from 'react';

import { Creator } from '../types/creator-list.interface';
import { Subscription } from '../types/subscriptions.interface';
import { User } from '../types/user.interface';
import { useStorageState } from '../storage/useStorageState';
import { fetchSubscriptions } from './useGetSubscription';
import { fetchCreatorList } from './useGetCreatorList';
import { refreshAccessToken, isTokenExpiringSoon } from './tokenRefresh';
import { registerRefreshCallback, unregisterRefreshCallback } from './apiClient';

interface SignInParams {
  token: string;
  user: User;
  refreshToken?: string;
  tokenExpiration?: Date | string;
}

export interface AuthState {
  user?: User;
  subscriptions?: Subscription[];
  subscription?: Subscription;
  creators?: Creator[];
  creator?: Creator;
  token?: string | null;
  tokenExpiration?: string | null;
  refreshToken?: string | null;
  signIn: (params: SignInParams) => void;
  signOut: () => void;
  setSubscription: (subscription: Subscription) => void;
  setCreator: (creator: Creator) => void;
  isLoading: boolean;
  refreshSession: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState>({
  signIn: _ => null,
  signOut: () => null,
  setSubscription: () => null,
  setCreator: () => null,
  isLoading: false,
  refreshSession: async () => null,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[tokenLoading, token], setToken] = useStorageState('fptoken');
  const [[tokenExpirationLoading, tokenExpiration], setTokenExpiration] = useStorageState('fptokenExpiration');
  const [[refreshTokenLoading, refreshToken], setRefreshToken] = useStorageState('fprefreshToken');
  const [[userLoading, user], setUser] = useStorageState('fpuser');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>();
  const [subscription, setSubscription] = useState<Subscription>();
  const [creators, setCreators] = useState<Creator[]>();
  const [creator, setCreator] = useState<Creator>();

  // Ref for proactive refresh timer
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard to prevent multiple simultaneous refreshes
  const isRefreshingRef = useRef(false);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const handleFetchErr = (err?: Error | unknown) => {
    console.error('[Auth] Error during data fetch:', err);
    setToken(undefined);
    setUser(undefined);
    setRefreshToken(undefined);
    setTokenExpiration(undefined);
    return err;
  };

  const fetchSubscriptionCreators = async (t: string, _te?: string) => {
    // Fetch subscriptions using Bearer token
    const subscriptionsResult = await fetchSubscriptions(t, _te);
    if (!subscriptionsResult || subscriptionsResult.length === 0) return handleFetchErr('No subscriptions found');

    setSubscriptions(subscriptionsResult);
    setSubscription(subscriptionsResult[0]);
    // Fetch creators for the subscriptions
    const creatorIds = subscriptionsResult.map(sub => sub.creator);
    const creatorsListResult = await fetchCreatorList(t, _te, creatorIds);
    if (!creatorsListResult || creatorsListResult.length === 0) {
      return handleFetchErr('No creators found');
    }

    setCreators(creatorsListResult);
    setCreator(creatorsListResult[0]);
  };

  // Refresh the session using the stored refresh token
  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] No refresh token available');
      return null;
    }

    if (isRefreshingRef.current) {
      console.info('[Auth] Refresh already in progress');
      return token ?? null;
    }

    isRefreshingRef.current = true;
    console.info('[Auth] Refreshing access token...');

    try {
      const result = await refreshAccessToken(refreshToken);
      const newExpiration = new Date(Date.now() + result.expiresIn * 1000).toISOString();

      setToken(result.accessToken);
      setTokenExpiration(newExpiration);

      // Update refresh token if the provider rotates it
      if (result.refreshToken && result.refreshToken !== refreshToken) {
        setRefreshToken(result.refreshToken);
      }

      console.info('[Auth] Token refreshed successfully, expires at:', newExpiration);
      return result.accessToken;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      // If refresh fails, the refresh token is likely expired/revoked — sign out
      handleFetchErr(error);
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshToken, token, setToken, setTokenExpiration, setRefreshToken]);

  // Register the refresh callback with the API client
  useEffect(() => {
    registerRefreshCallback(refreshSession);
    return () => {
      unregisterRefreshCallback();
    };
  }, [refreshSession]);

  // Proactive token refresh timer
  useEffect(() => {
    clearRefreshTimer();

    if (!token || !refreshToken) {
      return;
    }

    // Check every 60 seconds if the token needs refreshing
    refreshTimerRef.current = setInterval(async () => {
      if (isTokenExpiringSoon(tokenExpiration, 5)) {
        console.info('[Auth] Token expiring soon, triggering proactive refresh');
        try {
          await refreshSession();
        } catch (error) {
          console.error('[Auth] Proactive refresh failed:', error);
        }
      }
    }, 60 * 1000); // Check every minute

    return clearRefreshTimer;
  }, [token, refreshToken, tokenExpiration, clearRefreshTimer, refreshSession]);

  // Also do an immediate check on mount/when token changes
  useEffect(() => {
    if (token && refreshToken && isTokenExpiringSoon(tokenExpiration, 5) && !isRefreshingRef.current) {
      console.info('[Auth] Token already expiring soon on load, refreshing immediately');
      refreshSession();
    }
  }, [token, refreshToken, tokenExpiration, refreshSession]);

  useEffect(() => {
    if (token && !tokenLoading && !userLoading && !tokenExpirationLoading && !refreshTokenLoading) {
      const fetchData = async () => {
        console.info('[Auth] Starting to fetch data...');
        try {
          await fetchSubscriptionCreators(token, tokenExpiration || undefined);
        } catch (error) {
          handleFetchErr(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else if (!token && !tokenLoading) {
      setUser(undefined);
      setSubscriptions(undefined);
      setSubscription(undefined);
      setCreators(undefined);
      setCreator(undefined);
      setIsLoading(false);
    } else {
      console.info('[Auth] Waiting for token to load...');
    }
  }, [token, tokenLoading, setToken]);

  const signIn = async ({ token: t, user: u, tokenExpiration: tE, refreshToken: rT }: SignInParams) => {
    try {
      console.info('[Auth] Signing in user:', u);

      setToken(t);
      setUser(JSON.stringify(u));
      setTokenExpiration(tE && typeof tE === 'string' ? tE : tE instanceof Date ? tE.toISOString() : undefined);
      if (rT) {
        setRefreshToken(rT);
      }

      // Fetch subscriptions using the Bearer token
      const safeExpiration = tE && typeof tE === 'string' ? tE : tE instanceof Date ? tE.toISOString() : undefined;
      await fetchSubscriptionCreators(t, safeExpiration);
      setIsLoading(false);
    } catch (error) {
      console.error('[Auth] Error during sign-in:', error);
      handleFetchErr(error);
    }
  };
  const signOut = async () => {
    clearRefreshTimer();
    setToken(undefined);
    setUser(undefined);
    setSubscriptions(undefined);
    setCreators(undefined);
    setCreator(undefined);
    setRefreshToken(undefined);
    setTokenExpiration(undefined);
  };

  return (
    <AuthContext
      value={{
        signIn,
        signOut,
        setSubscription,
        setCreator,
        token,
        tokenExpiration,
        refreshToken,
        user: user ? JSON.parse(user) : undefined,
        subscriptions,
        subscription,
        creators,
        creator,
        isLoading,
        refreshSession,
      }}
    >
      {children}
    </AuthContext>
  );
}
