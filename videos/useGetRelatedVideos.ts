import { useQuery } from '@tanstack/react-query';

import { Video } from '../types/video.interface';
import { authenticatedFetch } from '../auth/apiClient';

const fetchRelatedVideos = async (token: string, _tokenExpiration: string | undefined, id: string): Promise<Video[]> => {
  const response = await authenticatedFetch(`/api/v3/content/related?id=${id}`, token);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch related videos: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const useGetRelatedVideos = (token?: string, tokenExpiration?: string, id?: string) =>
  useQuery({
    queryKey: ['related-videos', token, tokenExpiration, id],
    queryFn: () => fetchRelatedVideos(token!, tokenExpiration, id!),
    enabled: !!token && !!id,
  });
