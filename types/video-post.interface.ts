import { Image, ImageChild, LiveStream, SubscriptionPlan, UserInteraction } from './video.interface';

export interface VideoLevel {
  name: string;
  width: number;
  height: number;
  label: string;
  order: number;
}

export interface TextTrack {
  url: string;
  kind: string;
  label: string;
  language: string;
}

export interface TimelineSprite {
  width: number;
  height: number;
  path: string;
  childImages: ImageChild[];
}

export interface AudioWaveform {
  dataSetLength: number;
  highestValue: number;
  lowestValue: number;
  data: number[];
}

export interface GalleryAttachment {
  id: string;
  guid: string;
  title: string;
  type: 'gallery';
  description: string;
  likes: number;
  dislikes: number;
  score: number;
  isProcessing: boolean;
  primaryBlogPost: string;
  thumbnail: Image;
  userInteraction: UserInteraction[];
}

export interface VideoAttachment {
  id: string;
  guid: string;
  title: string;
  type: 'video';
  description: string;
  releaseDate: string | null;
  duration: number;
  creator: string;
  likes: number;
  dislikes: number;
  score: number;
  isProcessing: boolean;
  primaryBlogPost: string;
  levels: VideoLevel[];
  textTracks: TextTrack[];
  selfUserInteraction: UserInteraction | null;
  thumbnail: Image;
  isAccessible: boolean;
  blogPosts: string[];
  timelineSprite: TimelineSprite;
}

export interface AudioAttachment {
  id: string;
  guid: string;
  title: string;
  type: 'audio';
  description: string;
  duration: number;
  waveform: AudioWaveform;
  creator: string;
  likes: number;
  dislikes: number;
  score: number;
  isProcessing: boolean;
  primaryBlogPost: string;
  userInteraction: UserInteraction[];
  audioAttachment: string;
}

export interface PictureAttachment {
  id: string;
  guid: string;
  title: string;
  type: 'picture';
  description: string;
  likes: number;
  dislikes: number;
  score: number;
  isProcessing: boolean;
  primaryBlogPost: string;
  thumbnail: Image;
  userInteraction: UserInteraction[];
}

export interface ChannelInfo {
  id: string;
  creator: string;
  title: string;
  urlname: string;
  about: string;
  order: number;
  cover: Image | null;
  card: Image | null;
  icon: Image;
}

export interface CreatorInfo {
  id: string;
  owner: string;
  title: string;
  urlname: string;
  description: string;
  about: string;
  category: string;
  cover: Image | null;
  icon: Image;
  card: Image | null;
  liveStream: LiveStream | null;
  subscriptionPlans: SubscriptionPlan[] | null;
  discoverable: boolean;
  visibility: string;
  subscriberCountDisplay: string;
  incomeDisplay: boolean;
  defaultChannel: string;
}

export interface VideoPostMetadata {
  hasVideo: boolean;
  videoCount: number;
  videoDuration: number;
  hasAudio: boolean;
  audioCount: number;
  audioDuration: number;
  hasPicture: boolean;
  pictureCount: number;
  isFeatured: boolean;
  displayDuration: number;
  hasGallery: boolean;
  galleryCount: number;
}

export interface VideoPost {
  id: string;
  guid: string;
  title: string;
  text: string;
  textMarkdown: string;
  type: string;
  channel: ChannelInfo;
  tags: string[];
  attachmentOrder: string[];
  releaseDate: string | null;
  duration?: number;
  likes: number;
  dislikes: number;
  score: number;
  comments: number;
  creator: CreatorInfo;
  wasReleasedSilently: boolean;
  metadata: VideoPostMetadata;
  galleryAttachments: GalleryAttachment[];
  selfUserInteraction: UserInteraction | null;
  thumbnail: Image;
  isAccessible: boolean;
  userInteraction: UserInteraction[];
  videoAttachments: VideoAttachment[];
  audioAttachments: AudioAttachment[];
  pictureAttachments: PictureAttachment[];
  progress?: number | null;
}
