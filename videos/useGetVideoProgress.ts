import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '../auth/apiClient';
import { ContentProgress } from '../types/video-progress.interface';

const fetchVideoProgress = async (token: string, ids: string[]): Promise<ContentProgress[]> => {
  if (ids.length === 0) return [];

  // Floatplane seems to handle about 20 IDs per request comfortably
  const CHUNK_SIZE = 20;
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map(async chunk => {
      const queryParams = new URLSearchParams();
      chunk.forEach((id, index) => {
        queryParams.append(`ids[${index}]`, id);
      });
      queryParams.append('contentType', 'blogPost');

      const response = await authenticatedFetch(`/api/v3/content/progress?${queryParams.toString()}`, token);

      if (!response.ok) {
        // If one chunk fails, log it but don't crash the whole query
        console.error(`Failed to fetch video progress chunk: ${response.status}`);
        return [];
      }

      return response.json();
    }),
  );

  // Flatten and return all results
  return results.flat();
};

export const useGetVideoProgress = (token?: string, ids: string[] = []) =>
  useQuery({
    queryKey: ['video-progress', token, ids],
    queryFn: () => fetchVideoProgress(token!, ids),
    enabled: !!token && ids.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    placeholderData: keepPreviousData,
  });
