export interface VideoDeliveryResource {
  uri?: string;
  url: string;
  name?: string;
  label?: string;
  qualityLevel?: number;
  qualityLevelParams?: {
    level: string;
  };
  mimeType?: string;
  order?: number;
  height?: number;
  width?: number;
  enabled?: boolean;
  hidden?: boolean;
  meta?: {
    live?: {
      lowLatencyExtension?: string;
    };
    common?: {
      access?: {
        deniedReason?: string;
        deniedMessage?: string;
      };
    };
  };
}

export interface VideoDeliveryGroup {
  id?: string;
  label?: string;
  origins: {
    id?: string;
    url: string;
    label?: string;
  }[];
  variants: VideoDeliveryResource[];
}

export interface VideoDelivery {
  groups: VideoDeliveryGroup[];
}
