import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '../auth/apiClient';
import { VideoPost } from '../types/video-post.interface';
import { ContentProgress } from '../types/video-progress.interface';

interface UpdateProgressParams {
  id: string;
  progress: number;
}

export const updateVideoProgress = async (token: string, params: UpdateProgressParams): Promise<void> => {
  const { id, progress } = params;

  const response = await authenticatedFetch(`/api/v3/content/progress`, token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      contentType: 'blogPost',
      progress: Math.floor(progress),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update video progress: ${response.status} - ${errorText}`);
  }
};

export const useUpdateVideoProgress = (token?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateProgressParams) => updateVideoProgress(token!, params),
    onSuccess: (_, variables) => {
      // Update any cached video-post data for this video
      queryClient.setQueriesData<VideoPost>({ queryKey: ['video-post', token] }, (oldData) => {
        if (!oldData || oldData.id !== variables.id) return oldData;
        return { ...oldData, progress: variables.progress };
      });

      // Update any cached batch progress data that includes this video
      queryClient.setQueriesData<ContentProgress[]>({ queryKey: ['video-progress', token] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((p) =>
          p.id === variables.id ? { ...p, progress: variables.progress } : p
        );
      });
    },
  });
};
