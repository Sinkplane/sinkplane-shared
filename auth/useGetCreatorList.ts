import { useQuery } from '@tanstack/react-query';

import { Creator } from '../types/creator-list.interface';
import { authenticatedFetch } from './apiClient';

export const fetchCreatorList = async (token: string, _tokenExpiration?: string, creatorIds?: string[]): Promise<Creator[]> => {
  if (!creatorIds || creatorIds.length === 0) return [];

  const params = new URLSearchParams();
  creatorIds.forEach((id, index) => params.append(`ids[${index}]`, id));

  const response = await authenticatedFetch(`/api/v3/creator/list?${params.toString()}`, token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch creator list: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetCreatorList = (token?: string, tokenExpiration?: string, creatorIds?: string[]) =>
  useQuery({
    queryKey: ['creatorList', token, tokenExpiration, creatorIds],
    queryFn: () => fetchCreatorList(token!, tokenExpiration, creatorIds),
    enabled: !!token && !!creatorIds && creatorIds.length > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 30000, // 30 seconds (formerly cacheTime)
  });
