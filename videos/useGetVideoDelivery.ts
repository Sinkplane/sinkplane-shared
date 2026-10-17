import { useQuery } from '@tanstack/react-query';

import { VideoDelivery } from '../types/video-delivery.interface';
import { authenticatedFetch } from '../auth/apiClient';

export interface GetVideoDeliveryParams {
  videoId: string;
  quality?: string;
  live?: boolean;
}

const fetchVideoDelivery = async (
  token: string,
  _tokenExpiration: string | undefined,
  id: string,
  live: boolean = false,
): Promise<VideoDelivery> => {
  const scenario = live ? 'live' : 'onDemand';
  const entityKind = live ? '&entityKind=livestream' : '';
  const response = await authenticatedFetch(`/api/v3/delivery/info?scenario=${scenario}&entityId=${id}${entityKind}`, token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch video delivery: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetVideoDelivery = (token?: string, tokenExpiration?: string, id?: string, live: boolean = false) =>
  useQuery({
    queryKey: ['video-delivery', token, tokenExpiration, id, live],
    queryFn: () => fetchVideoDelivery(token!, tokenExpiration, id!, live),
    enabled: !!token && !!id,
    staleTime: 60000, // 60 seconds - match polling interval to prevent unnecessary refetches
    gcTime: 120000, // 2 minutes (formerly cacheTime)
  });
