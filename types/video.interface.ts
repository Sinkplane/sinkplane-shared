export interface ImageChild {
  width: number;
  height: number;
  path: string;
}

export interface Image {
  width: number;
  height: number;
  path: string;
  childImages: ImageChild[];
}

export interface Channel {
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

export interface Category {
  id: string;
  title: string;
}

export interface Owner {
  id: string;
  username: string;
}

export interface LiveStreamOffline {
  title: string;
  description: string;
  thumbnail: Image;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  thumbnail: Image;
  owner: string;
  channel: string;
  streamPath: string;
  offline: LiveStreamOffline;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  priceYearly: string;
  currency: string;
  logo: Image | null;
  interval: string;
  featured: boolean;
  allowGrandfatheredAccess: boolean;
  discordServers: string[];
  discordRoles: string[];
  enabled: boolean;
  enabledGlobal: boolean;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
  facebook?: string;
  youtube?: string;
}

export interface Creator {
  id: string;
  owner: Owner;
  title: string;
  urlname: string;
  description: string;
  about: string;
  category: Category;
  cover: Image;
  icon: Image;
  card: Image;
  liveStream: LiveStream;
  subscriptionPlans: SubscriptionPlan[];
  discoverable: boolean;
  visibility: string;
  subscriberCountDisplay: string;
  incomeDisplay: boolean;
  defaultChannel: string;
  socialLinks: SocialLinks;
  channels: string[];
}

export interface VideoMetadata {
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

export interface UserInteraction {
  liked: boolean;
  disliked: boolean;
  favorited: boolean;
}

export interface Video {
  id: string;
  guid: string;
  title: string;
  text: string;
  textMarkdown: string;
  type: string;
  channel: Channel;
  tags: string[];
  attachmentOrder: string[];
  releaseDate: string | null;
  likes: number;
  dislikes: number;
  score: number;
  comments: number;
  creator: Creator;
  wasReleasedSilently: boolean;
  metadata: VideoMetadata;
  galleryAttachments: string[];
  selfUserInteraction: UserInteraction | null;
  thumbnail: Image;
  isAccessible: boolean;
  videoAttachments: string[];
  audioAttachments: string[];
  pictureAttachments: string[];
  progress?: number | null;
}
