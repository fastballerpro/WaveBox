/**
 * SoundCloud API client (main process).
 * Uses the public api-v2 endpoint with a client_id auto-extracted from
 * SoundCloud's web bundle. No registration / no rate limit problems for
 * a single user.
 */

const HOMEPAGE = 'https://soundcloud.com/';
const API_V2 = 'https://api-v2.soundcloud.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let cachedClientId: string | null = null;
let cachedAt = 0;
const CLIENT_ID_TTL = 1000 * 60 * 60 * 6; // 6h

let oauthToken: string | null = null;

export function setOAuthToken(token: string | null) {
  oauthToken = token;
}

export function getOAuthToken() {
  return oauthToken;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'User-Agent': UA,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * Resolve a public client_id by scraping the SoundCloud homepage and
 * scanning the JS bundles for a `client_id:"..."` literal.
 */
export async function resolveClientId(force = false): Promise<string> {
  if (!force && cachedClientId && Date.now() - cachedAt < CLIENT_ID_TTL) {
    return cachedClientId;
  }
  const html = await fetchText(HOMEPAGE);
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => s.includes('sndcdn.com') || s.includes('soundcloud.com'));

  for (const src of scripts) {
    try {
      const js = await fetchText(src);
      const m =
        js.match(/client_id\s*:\s*"([a-zA-Z0-9]{20,})"/) ||
        js.match(/client_id=([a-zA-Z0-9]{20,})/);
      if (m) {
        cachedClientId = m[1];
        cachedAt = Date.now();
        return m[1];
      }
    } catch {
      /* try next */
    }
  }
  throw new Error('Failed to resolve SoundCloud client_id');
}

async function api<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const clientId = await resolveClientId();
  const url = new URL(path.startsWith('http') ? path : `${API_V2}${path}`);
  url.searchParams.set('client_id', clientId);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = {
    'User-Agent': UA,
    Accept: 'application/json, text/javascript, */*; q=0.1',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: 'https://soundcloud.com',
    Referer: 'https://soundcloud.com/',
  };
  if (oauthToken) headers['Authorization'] = `OAuth ${oauthToken}`;

  let res = await fetch(url.toString(), { headers });
  // If client_id became stale, refresh it once.
  if (res.status === 401 || res.status === 403) {
    const fresh = await resolveClientId(true);
    url.searchParams.set('client_id', fresh);
    res = await fetch(url.toString(), { headers });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[SC API]', res.status, url.toString(), body.slice(0, 200));
    throw new Error(`API ${res.status}: ${path}`);
  }
  return (await res.json()) as T;
}

/** Try a list of API calls in order; return the first that resolves with data. */
async function chain<T>(tries: Array<() => Promise<T>>): Promise<T> {
  let last: any;
  for (const t of tries) {
    try {
      const result = await t();
      // Also treat empty collection as failure so we try next
      if (result && typeof result === 'object' && 'collection' in (result as any)) {
        const col = (result as any).collection;
        if (Array.isArray(col) && col.length > 0) return result;
        last = new Error('Empty collection');
        continue;
      }
      return result;
    } catch (e) {
      last = e;
      console.error('[chain] attempt failed:', (e as Error).message);
    }
  }
  throw last ?? new Error('All API attempts failed');
}

/** Convert a genre slug to a human-readable search query. */
function genreQuery(genre: string): string {
  const map: Record<string, string> = {
    'all-music': '', 'all-audio': '',
    alternativerock: 'alternative rock', hiphoprap: 'hip hop rap',
    danceedm: 'dance edm', deephouse: 'deep house', drumbass: 'drum and bass',
    folksingersongwriter: 'folk singer songwriter', jazzblues: 'jazz blues',
    rbsoul: 'r&b soul', triphop: 'trip hop',
  };
  return map[genre] ?? genre;
}

/* ---------- public methods (called from renderer via IPC) ---------- */

export const sc = {
  resolveClientId,
  search(q: string, kind: 'tracks' | 'users' | 'playlists' | 'albums' | 'all' = 'all', limit = 30) {
    const path =
      kind === 'all'
        ? '/search'
        : kind === 'albums'
          ? '/search/albums'
          : `/search/${kind}`;
    return api<any>(path, { q, limit, offset: 0 });
  },
  track(id: number) {
    return api<any>(`/tracks/${id}`);
  },
  resolve(url: string) {
    return api<any>('/resolve', { url });
  },
  user(id: number) {
    return api<any>(`/users/${id}`);
  },
  userTracks(id: number, limit = 30) {
    return api<any>(`/users/${id}/tracks`, { limit });
  },
  userPlaylists(id: number, limit = 30) {
    return api<any>(`/users/${id}/playlists_without_albums`, { limit });
  },
  playlist(id: number) {
    return api<any>(`/playlists/${id}`, { show_tracks: true });
  },
  related(trackId: number, limit = 20) {
    return api<any>(`/tracks/${trackId}/related`, { limit });
  },
  /** Personalized recommendations based on seed track IDs */
  async recommendations(seedIds: number[], limit = 16): Promise<any> {
    if (!seedIds.length) return { collection: [] };
    // Pick up to 6 random seeds to diversify
    const seeds = seedIds.sort(() => Math.random() - 0.5).slice(0, 6);
    const results = await Promise.all(
      seeds.map((id) => api<any>(`/tracks/${id}/related`, { limit: Math.ceil(limit / seeds.length) }).catch(() => ({ collection: [] }))),
    );
    // Merge, deduplicate, shuffle
    const seen = new Set<number>();
    const all: any[] = [];
    for (const r of results) {
      for (const t of r.collection ?? []) {
        if (t?.id && !seen.has(t.id) && !seedIds.includes(t.id)) {
          seen.add(t.id);
          all.push(t);
        }
      }
    }
    // Shuffle for variety
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return { collection: all.slice(0, limit) };
  },
  /**
   * Trending tracks for a genre. Uses search sorted by hotness
   * since /charts is no longer available.
   */
  trending(genre = 'all-music', limit = 20): Promise<any> {
    const gq = genreQuery(genre);
    const q = gq || 'trending';
    return api<any>('/search/tracks', {
      q,
      limit,
      offset: 0,
      linked_partitioning: 1,
      'filter.created_at': 'last_week',
    });
  },

  /** Top / popular tracks for a genre. */
  top(genre = 'all-music', limit = 20): Promise<any> {
    const gq = genreQuery(genre);
    if (!gq) {
      // "All" genre — try mixed-selections first for real curated content
      return chain([
        () => api<any>('/mixed-selections', { limit: 5 }),
        () => api<any>('/search/tracks', { q: 'popular', limit, offset: 0, linked_partitioning: 1 }),
      ]);
    }
    return api<any>('/search/tracks', {
      q: gq + ' popular',
      limit,
      offset: 0,
      linked_partitioning: 1,
    });
  },
  /* --- follows --- */
  /** Follow is captcha-blocked by SC — handled locally in renderer store. */
  async follow(_userId: number) {
    return { local: true };
  },
  async unfollow(userId: number) {
    if (!oauthToken) throw new Error('not authenticated');
    const clientId = await resolveClientId();
    const url = `${API_V2}/me/followings/${userId}?client_id=${clientId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'User-Agent': UA,
        Authorization: `OAuth ${oauthToken}`,
        Origin: 'https://soundcloud.com',
        Referer: 'https://soundcloud.com/',
      },
    });
    console.log('[unfollow]', res.status, userId);
    return res.ok;
  },
  async isFollowing(userId: number): Promise<boolean> {
    if (!oauthToken) return false;
    try {
      const me = await api<any>('/me');
      // /users/{id}/followings returns paginated list of followed users
      const data = await api<any>(`/users/${me.id}/followings`, { limit: 300, linked_partitioning: 1 });
      const ids = (data?.collection ?? []).map((u: any) => u.id);
      const found = ids.includes(userId);
      console.log('[isFollowing]', userId, 'in', ids.length, 'followings:', found);
      return found;
    } catch (e) {
      console.error('[isFollowing] error:', (e as Error).message);
      return false;
    }
  },
  /* --- requires oauth --- */
  me() {
    return api<any>('/me');
  },
  /**
   * Liked tracks. SC's /me/track_likes is currently 404, but
   * /users/{me.id}/track_likes works. We resolve `me` once if needed.
   */
  async myLikes(limit = 50): Promise<any> {
    const me = await api<any>('/me');
    return chain([
      () =>
        api<any>(`/users/${me.id}/track_likes`, {
          limit,
          offset: 0,
          linked_partitioning: 1,
        }),
      () => api<any>('/me/track_likes', { limit, offset: 0, linked_partitioning: 1 }),
    ]);
  },
  async myPlaylistLikes(limit = 50): Promise<any> {
    const me = await api<any>('/me');
    return chain([
      () => api<any>(`/users/${me.id}/playlist_likes`, { limit, offset: 0, linked_partitioning: 1 }),
      () => api<any>('/me/playlist_likes', { limit, offset: 0, linked_partitioning: 1 }),
    ]);
  },
  myStream(limit = 50) {
    return chain([
      () => api<any>('/stream', { limit, offset: 0, linked_partitioning: 1 }),
      () => api<any>('/me/feed', { limit, offset: 0, linked_partitioning: 1 }),
    ]);
  },
  async myPlaylists(limit = 50): Promise<any> {
    const me = await api<any>('/me');
    return chain([
      () =>
        api<any>(`/users/${me.id}/playlists_without_albums`, {
          limit,
          offset: 0,
          linked_partitioning: 1,
        }),
      () => api<any>('/me/library/all', { limit, offset: 0, linked_partitioning: 1 }),
    ]);
  },
  /**
   * Resolve a transcoding URL (HLS or progressive) into the actual playable URL.
   * The `transcoding.url` returns `{ url: 'https://cf-hls...' }` when called with
   * client_id. Renderer feeds this to hls.js / <audio>.
   */
  async streamUrl(transcodingUrl: string) {
    const clientId = await resolveClientId();
    const u = new URL(transcodingUrl);
    u.searchParams.set('client_id', clientId);
    if (oauthToken) u.searchParams.set('oauth_token', oauthToken);
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) throw new Error(`streamUrl ${res.status}`);
    const data = (await res.json()) as { url: string };
    return data.url;
  },
};

export type ScApi = typeof sc;
