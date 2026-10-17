import { useQuery } from '@tanstack/react-query';

import { IStatusResponse } from '../types/status.interface';
import { authenticatedFetch } from './apiClient';

export const fetchProfile = async (token: string, _tokenExpiration?: string): Promise<IStatusResponse> => {
  const response = await authenticatedFetch('/api/v3/status?platform=web&version=4.4.8', token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetProfile = (token?: string, tokenExpiration?: string) =>
  useQuery({
    queryKey: ['profile', token, tokenExpiration],
    queryFn: () => fetchProfile(token!, tokenExpiration),
    enabled: !!token,
    staleTime: 0,
    gcTime: 0,
  });
