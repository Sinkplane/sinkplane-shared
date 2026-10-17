import { Video } from './video.interface';

export interface ContentHistoryEntry {
  userId: string;
  contentId: string;
  contentType: string;
  progress: number;
  updatedAt: string;
  blogPost: Video;
}
