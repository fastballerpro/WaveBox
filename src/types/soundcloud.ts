export interface ScUser {
  id: number;
  kind: 'user';
  username: string;
  permalink_url: string;
  avatar_url: string | null;
  followers_count?: number;
  city?: string | null;
  country_code?: string | null;
  description?: string | null;
  verified?: boolean;
}

export interface ScTranscoding {
  url: string;
  preset: string;
  duration: number;
  snipped: boolean;
  format: { protocol: 'hls' | 'progressive'; mime_type: string };
  quality: string;
}

export interface ScTrack {
  id: number;
  kind: 'track';
  title: string;
  permalink_url: string;
  duration: number; // ms
  full_duration?: number;
  artwork_url: string | null;
  description?: string | null;
  genre?: string | null;
  user: ScUser;
  playback_count?: number;
  likes_count?: number;
  comment_count?: number;
  reposts_count?: number;
  created_at?: string;
  media?: { transcodings: ScTranscoding[] };
  streamable?: boolean;
  policy?: string;
  monetization_model?: string;
}

export interface ScPlaylist {
  id: number;
  kind: 'playlist';
  title: string;
  permalink_url: string;
  duration: number;
  artwork_url: string | null;
  is_album?: boolean;
  track_count: number;
  tracks?: ScTrack[];
  user: ScUser;
}

export type ScCollectionItem =
  | ScTrack
  | ScPlaylist
  | ScUser
  | { kind: string; [key: string]: any };

export interface ScCollectionResponse<T = ScCollectionItem> {
  collection: T[];
  next_href?: string | null;
  query_urn?: string;
  total_results?: number;
}
