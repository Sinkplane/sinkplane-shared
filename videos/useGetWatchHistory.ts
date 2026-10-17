import { useInfiniteQuery } from '@tanstack/react-query';

import { authenticatedFetch } from '../auth/apiClient';
import { ContentHistoryEntry } from '../types/history.interface';

const fetchWatchHistory = async (
  token: string,
  _tokenExpiration: string | undefined,
  offset: number,
): Promise<ContentHistoryEntry[]> => {
  const response = await authenticatedFetch(`/api/v3/content/history?offset=${offset}`, token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch watch history: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetWatchHistoryInfinite = (token?: string, tokenExpiration?: string) =>
  useInfiniteQuery({
    queryKey: ['watch-history-infinite', token, tokenExpiration],
    queryFn: ({ pageParam = 0 }) => fetchWatchHistory(token!, tokenExpiration, pageParam),
    enabled: !!token,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });
