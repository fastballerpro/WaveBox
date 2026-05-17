import type { ScTrack, ScCollectionResponse, ScPlaylist, ScUser } from '@/types/soundcloud';

const sc = window.wavebox.sc;

export const api = {
  search: (q: string, kind: 'tracks' | 'users' | 'playlists' | 'albums' | 'all' = 'tracks', limit = 30) =>
    sc<ScCollectionResponse>('search', q, kind, limit),
  trending: (genre?: string, limit = 24) =>
    sc<ScCollectionResponse<ScTrack>>('trending', genre, limit),
  top: (genre?: string, limit = 24) =>
    sc<ScCollectionResponse<ScTrack>>('top', genre, limit),
  track: (id: number) => sc<ScTrack>('track', id),
  related: (id: number, limit = 20) => sc<ScCollectionResponse<ScTrack>>('related', id, limit),
  recommendations: (seedIds: number[], limit = 16) => sc<ScCollectionResponse<ScTrack>>('recommendations', seedIds, limit),
  user: (id: number) => sc<ScUser>('user', id),
  userTracks: (id: number, limit = 30) => sc<ScCollectionResponse<ScTrack>>('userTracks', id, limit),
  userPlaylists: (id: number, limit = 30) => sc<ScCollectionResponse<ScPlaylist>>('userPlaylists', id, limit),
  playlist: (id: number) => sc<ScPlaylist>('playlist', id),
  resolve: (url: string) => sc<any>('resolve', url),
  me: () => sc<ScUser>('me'),
  myLikes: (limit = 50) => sc<ScCollectionResponse>('myLikes', limit),
  myPlaylistLikes: (limit = 50) => sc<ScCollectionResponse>('myPlaylistLikes', limit),
  myStream: (limit = 50) => sc<ScCollectionResponse>('myStream', limit),
  myPlaylists: (limit = 50) => sc<ScCollectionResponse>('myPlaylists', limit),
  streamUrl: (transcodingUrl: string) => sc<string>('streamUrl', transcodingUrl),
  follow: (userId: number) => sc<boolean>('follow', userId),
  unfollow: (userId: number) => sc<boolean>('unfollow', userId),
  isFollowing: (userId: number) => sc<boolean>('isFollowing', userId),
};

/** Pick a SoundCloud artwork URL with a chosen size. */
export function artwork(url: string | null | undefined, size: 't50x50' | 't120x120' | 't200x200' | 't500x500' | 'original' = 't500x500') {
  if (!url) return null;
  return url.replace(/-(large|t\d+x\d+|original)\.(jpg|png|webp)/, `-${size}.$2`);
}

/** Artwork with fallback for playlists (uses first track artwork if playlist has none). */
export function playlistArtwork(
  playlist: { artwork_url?: string | null; tracks?: Array<{ artwork_url?: string | null }> },
  size: 't50x50' | 't120x120' | 't200x200' | 't500x500' | 'original' = 't500x500',
) {
  const raw = playlist.artwork_url ?? playlist.tracks?.[0]?.artwork_url ?? null;
  return artwork(raw, size);
}

/* ---- Lightweight image-URL dedup cache (no blob copies) ---- */
const IMG_CACHE_MAX = 150;
const imgSeen = new Set<string>();

/** Mark a URL as "seen" so the browser disk-cache handles it. Evicts oldest if over limit. */
export function cachedImg(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (!imgSeen.has(url)) {
    if (imgSeen.size >= IMG_CACHE_MAX) {
      const first = imgSeen.values().next().value;
      if (first) imgSeen.delete(first);
    }
    imgSeen.add(url);
  }
  return url;
}
