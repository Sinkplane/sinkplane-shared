/**
 * Barrel for @sinkplane/shared.
 *
 * Everything reusable across the Sinkplane apps lives here:
 *  - Floatplane API client + endpoints and OIDC device flow
 *  - Auth context (SessionProvider / useSession) and token refresh
 *  - Floatplane query hooks (content, delivery, progress, history)
 *  - TV connection server (TCP + Bonjour/Zeroconf)
 *  - Secure storage hook, theme context/hooks, shared colors
 *  - Floatplane/TV protocol types
 *
 * Note: the `creator-list.interface` and `subscriptions.interface` modules
 * intentionally collide with the content-side names in `video.interface`
 * (Creator, Channel, SubscriptionPlan, …) so they are NOT re-exported from
 * this barrel. Import them via subpaths:
 *   import { Creator, Channel } from '@sinkplane/shared/types/creator-list.interface';
 *   import { Subscription } from '@sinkplane/shared'; // Subscription itself is unique
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export { API_BASE_URL, OIDC_CLIENT_ID, OIDC_SCOPE, OIDC_DEVICE_AUTH_ENDPOINT, OIDC_TOKEN_ENDPOINT } from './constants/api';
export { Colors } from './constants/colors';

// ---------------------------------------------------------------------------
// Types (unique names only — see file header for the colliding modules)
// ---------------------------------------------------------------------------

export * from './types/api-response.interface';
export * from './types/history.interface';
export * from './types/message.interface';
export * from './types/status.interface';
export * from './types/tv-device.interface';
export * from './types/user.interface';
export * from './types/video-delivery.interface';
export * from './types/video-post.interface';
export * from './types/video-progress.interface';
export * from './types/video.interface';
export { Subscription, SubscriptionPlan as UserSubscriptionPlan } from './types/subscriptions.interface';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export { setStorageItemAsync, useStorageState } from './storage/useStorageState';

// ---------------------------------------------------------------------------
// Auth: API client, token refresh, OIDC device flow, context
// ---------------------------------------------------------------------------

export { authenticatedFetch, type AuthenticatedFetchOptions } from './auth/apiClient';
export {
  isTokenExpired,
  isTokenExpiringSoon,
  refreshAccessToken,
  type RefreshTokenResult,
} from './auth/tokenRefresh';
export { useOIDCDeviceFlow, type DeviceAuthResponse, type OIDCDeviceFlowState, type OIDCStatus, type TokenResponse } from './auth/useOIDCDeviceFlow';
export { fetchCreatorList, useGetCreatorList } from './auth/useGetCreatorList';
export { fetchProfile, useGetProfile } from './auth/useGetProfile';
export { fetchSubscriptions, useGetSubscriptions } from './auth/useGetSubscription';
export { SessionProvider, useSession, type AuthState } from './auth/auth.context';

// ---------------------------------------------------------------------------
// TV connection (TCP server on port 9999 + Bonjour discovery)
// ---------------------------------------------------------------------------

export { useTVServer } from './connection/useTVServer';

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export { ThemeProvider, useTheme, type ThemeMode, type ThemeState } from './theme/theme.context';
export { useColorScheme } from './theme/useColorScheme';
export { useThemeColor } from './theme/useThemeColor';

// ---------------------------------------------------------------------------
// Content query hooks
// ---------------------------------------------------------------------------

export { AssDass, useGetVideos, useGetVideosInfinite, type GetVideosParams } from './videos/useGetVideos';
export { useGetRelatedVideos } from './videos/useGetRelatedVideos';
export { useGetVideoDelivery, type GetVideoDeliveryParams } from './videos/useGetVideoDelivery';
export { useGetVideoPost, type GetVideoPostParams } from './videos/useGetVideoPost';
export { useGetVideoProgress } from './videos/useGetVideoProgress';
export { useGetWatchHistoryInfinite } from './videos/useGetWatchHistory';
export { updateVideoProgress, useUpdateVideoProgress } from './videos/useUpdateVideoProgress';