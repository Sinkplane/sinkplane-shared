export interface Creator {
  id: string;
  owner: Owner;
  title: string;
  urlname: string;
  description: string;
  about: string;
  category: Category;
  cover: ImageResource;
  icon: ImageResource;
  card: ImageResource;
  liveStream?: LiveStream;
  subscriptionPlans: SubscriptionPlan[];
  discoverable: boolean;
  visibility: string;
  subscriberCountDisplay: string;
  incomeDisplay: boolean;
  defaultChannel: string;
  socialLinks: SocialLinks;
  channels: Channel[];
  discordServers: DiscordServer[];
}

export interface Owner {
  id: string;
  username: string;
}

export interface Category {
  id: string;
  title: string;
}

export interface ImageResource {
  width: number;
  height: number;
  path: string;
  childImages: ChildImage[];
}

export interface ChildImage {
  width: number;
  height: number;
  path: string;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  thumbnail: ImageResource;
  owner: string;
  channel: string;
  streamPath: string;
  offline: OfflineInfo;
}

export interface OfflineInfo {
  title: string;
  description: string;
  thumbnail: ImageResource;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  priceYearly: string;
  currency: string;
  logo: string | null;
  interval: string;
  featured: boolean;
  allowGrandfatheredAccess: boolean;
  discordServers: string[];
  discordRoles: string[];
  enabled: boolean;
  enabledGlobal: boolean;
}

export interface SocialLinks {
  youtube?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  facebook?: string;
}

export interface Channel {
  id: string;
  creator: string;
  title: string;
  urlname: string;
  about: string;
  order: number;
  cover: ImageResource | null;
  card: ImageResource | null;
  icon: ImageResource;
  socialLinks: SocialLinks;
}

export interface DiscordServer {
  id: string;
  guildName: string;
  guildIcon: string;
  inviteLink: string;
  inviteMode: string;
}
