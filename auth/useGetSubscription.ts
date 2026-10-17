import { useQuery } from '@tanstack/react-query';

import { Subscription } from '../types/subscriptions.interface';
import { authenticatedFetch } from './apiClient';

export const fetchSubscriptions = async (token: string, _tokenExpiration?: string): Promise<Subscription[]> => {
  const response = await authenticatedFetch('/api/v3/user/subscriptions?active=true', token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch subscriptions: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetSubscriptions = (token?: string, tokenExpiration?: string) =>
  useQuery({
    queryKey: ['subscriptions', token, tokenExpiration],
    queryFn: () => fetchSubscriptions(token!, tokenExpiration),
    enabled: !!token,
  });
