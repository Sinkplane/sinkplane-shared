import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import { Video } from '../types/video.interface';
import { authenticatedFetch } from '../auth/apiClient';

/** Sort order for content listing requests (oldest/newest first). */
export enum AssDass {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface GetVideosParams {
  id: string;
  limit?: number;
  fetchAfter?: number;
  search?: string;
  sort?: AssDass;
  hasVideo?: boolean;
  hasAudio?: boolean;
  hasPicture?: boolean;
  hasText?: boolean;
  channel?: string;
}

const fetchVideos = async (token: string, _tokenExpiration: string | undefined, params: GetVideosParams): Promise<Video[]> => {
  const {
    id,
    limit = 10,
    fetchAfter = 0,
    search = '',
    sort = 'DESC',
    hasVideo = false,
    hasAudio = false,
    hasPicture = false,
    hasText = false,
    channel,
  } = params;

  const queryParams = new URLSearchParams({
    id,
    limit: limit.toString(),
    fetchAfter: fetchAfter.toString(),
    search,
    sort,
    hasVideo: hasVideo.toString(),
    hasAudio: hasAudio.toString(),
    hasPicture: hasPicture.toString(),
    hasText: hasText.toString(),
  });

  if (channel) {
    queryParams.append('channel', channel);
  }

  const response = await authenticatedFetch(`/api/v3/content/creator?${queryParams.toString()}`, token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch videos: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetVideos = (token?: string, tokenExpiration?: string, params?: GetVideosParams) =>
  useQuery({
    queryKey: ['videos', token, tokenExpiration, params],
    queryFn: () => fetchVideos(token!, tokenExpiration, params!),
    enabled: !!token && !!params?.id,
  });

export const useGetVideosInfinite = (token?: string, tokenExpiration?: string, params?: Omit<GetVideosParams, 'fetchAfter'>) =>
  useInfiniteQuery({
    queryKey: ['videos-infinite', token, tokenExpiration, params],
    queryFn: ({ pageParam = 0 }) => fetchVideos(token!, tokenExpiration, { ...params!, fetchAfter: pageParam }),
    enabled: !!token && !!params?.id,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer videos than the limit, we've reached the end
      const limit = params?.limit || 10;
      if (lastPage.length < limit) {
        return undefined;
      }
      // Calculate the next offset based on total videos fetched so far
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });
