import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScTrack, ScUser, ScPlaylist } from '@/types/soundcloud';
import { audio, EQ_FREQUENCIES } from './audio';
import { api } from './api';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  /* now playing */
  current: ScTrack | null;
  queue: ScTrack[];
  history: ScTrack[];
  index: number; // index inside queue
  isPlaying: boolean;
  isLoading: boolean;
  position: number; // seconds
  duration: number; // seconds
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  /* eq */
  eqEnabled: boolean;
  eqGains: number[]; // length === EQ_FREQUENCIES.length
  /* playback speed */
  speed: number;
  preservePitch: boolean;
  /* library (local) */
  likes: ScTrack[];
  likedPlaylists: ScPlaylist[];
  recentPlays: ScTrack[];
  /* auth */
  me: ScUser | null;
  /* actions */
  play: (track: ScTrack, queue?: ScTrack[]) => Promise<void>;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueue: (track: ScTrack) => void;
  enqueueNext: (track: ScTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleLike: (track: ScTrack) => void;
  isLiked: (id: number) => boolean;
  togglePlaylistLike: (playlist: ScPlaylist) => void;
  isPlaylistLiked: (id: number) => boolean;
  setEqGain: (i: number, db: number) => void;
  setEqEnabled: (on: boolean) => void;
  resetEq: () => void;
  setSpeed: (rate: number) => void;
  setPreservePitch: (on: boolean) => void;
  setMe: (me: ScUser | null) => void;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      current: null,
      queue: [],
      history: [],
      index: -1,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      volume: 0.85,
      muted: false,
      shuffle: false,
      repeat: 'off',
      eqEnabled: false,
      eqGains: EQ_FREQUENCIES.map(() => 0),
      speed: 1,
      preservePitch: true,
      likes: [],
      likedPlaylists: [],
      recentPlays: [],
      me: null,

      play: async (track, queue) => {
        const baseQueue = queue && queue.length ? queue : [track];
        const idx = baseQueue.findIndex((t) => t.id === track.id);
        set({
          current: track,
          queue: baseQueue,
          index: idx === -1 ? 0 : idx,
          isLoading: true,
          recentPlays: [track, ...get().recentPlays.filter((r) => r.id !== track.id)].slice(0, 20),
        });

        // If the track is missing media (e.g. came from search snippet), refetch.
        let full = track;
        if (!track.media || !track.media.transcodings?.length) {
          try {
            full = await api.track(track.id);
            set({ current: full });
          } catch {
            /* fall through */
          }
        }

        await audio.loadTrack(full);

        // Discord RPC
        window.wavebox.rpc
          .set({
            title: full.title,
            artist: full.user.username,
            artwork: full.artwork_url,
            durationMs: full.full_duration ?? full.duration,
            positionMs: 0,
          })
          .catch(() => {});

        // Windows SMTC / MediaSession
        if ('mediaSession' in navigator) {
          const artUrl = full.artwork_url?.replace('-large.', '-t500x500.') ?? undefined;
          navigator.mediaSession.metadata = new MediaMetadata({
            title: full.title,
            artist: full.user?.username ?? 'Unknown',
            artwork: artUrl ? [{ src: artUrl, sizes: '500x500', type: 'image/jpeg' }] : [],
          });
        }
      },

      toggle: async () => {
        if (!get().current) return;
        if (get().isPlaying) audio.pause();
        else await audio.play();
      },

      next: async () => {
        const { queue, index, repeat, shuffle } = get();
        if (!queue.length) return;
        if (repeat === 'one' && get().current) {
          audio.seek(0);
          await audio.play();
          return;
        }
        let nextIdx: number;
        if (shuffle) {
          nextIdx = Math.floor(Math.random() * queue.length);
        } else if (index + 1 < queue.length) {
          nextIdx = index + 1;
        } else if (repeat === 'all') {
          nextIdx = 0;
        } else {
          // Auto-play related tracks when queue ends
          const last = queue[queue.length - 1];
          if (last) {
            try {
              const r = await api.related(last.id, 20);
              const related = (r.collection ?? []).filter(
                (t: any) => t?.id && !queue.some((q) => q.id === t.id),
              );
              if (related.length) {
                const newQueue = [...queue, ...related];
                set({ queue: newQueue, index: queue.length, current: related[0], isLoading: true });
                await audio.loadTrack(related[0]);
                return;
              }
            } catch {}
          }
          set({ isPlaying: false });
          window.wavebox.rpc.clear().catch(() => {});
          return;
        }
        const t = queue[nextIdx];
        set({ index: nextIdx, current: t, isLoading: true });
        await audio.loadTrack(t);
      },

      prev: async () => {
        const { queue, index, position } = get();
        if (!queue.length) return;
        if (position > 4) {
          audio.seek(0);
          return;
        }
        const i = index - 1 < 0 ? 0 : index - 1;
        const t = queue[i];
        set({ index: i, current: t, isLoading: true });
        await audio.loadTrack(t);
      },

      seek: (sec) => audio.seek(sec),

      setVolume: (v) => {
        audio.setVolume(v);
        set({ volume: v, muted: v === 0 });
      },

      toggleMute: () => {
        const { muted, volume } = get();
        if (muted) {
          audio.setVolume(volume || 0.7);
          set({ muted: false });
        } else {
          audio.setVolume(0);
          set({ muted: true });
        }
      },

      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),

      enqueue: (t) => set((s) => ({ queue: [...s.queue, t] })),
      enqueueNext: (t) =>
        set((s) => {
          const q = [...s.queue];
          q.splice(s.index + 1, 0, t);
          return { queue: q };
        }),
      removeFromQueue: (i) =>
        set((s) => {
          const q = s.queue.filter((_, idx) => idx !== i);
          let index = s.index;
          if (i < s.index) index -= 1;
          return { queue: q, index };
        }),
      clearQueue: () => set({ queue: [], index: -1 }),

      toggleLike: (t) =>
        set((s) => {
          const has = s.likes.some((l) => l.id === t.id);
          return { likes: has ? s.likes.filter((l) => l.id !== t.id) : [t, ...s.likes] };
        }),
      isLiked: (id) => get().likes.some((l) => l.id === id),

      togglePlaylistLike: (p) =>
        set((s) => {
          const has = s.likedPlaylists.some((l) => l.id === p.id);
          return { likedPlaylists: has ? s.likedPlaylists.filter((l) => l.id !== p.id) : [p, ...s.likedPlaylists] };
        }),
      isPlaylistLiked: (id) => get().likedPlaylists.some((l) => l.id === id),

      setEqGain: (i, db) => {
        audio.setEqGain(i, get().eqEnabled ? db : 0);
        set((s) => {
          const eqGains = [...s.eqGains];
          eqGains[i] = db;
          return { eqGains };
        });
      },
      setEqEnabled: (on) => {
        const { eqGains } = get();
        eqGains.forEach((g, i) => audio.setEqGain(i, on ? g : 0));
        set({ eqEnabled: on });
      },
      resetEq: () => {
        audio.resetEq();
        set({ eqGains: EQ_FREQUENCIES.map(() => 0) });
      },
      setSpeed: (rate) => {
        audio.setSpeed(rate);
        set({ speed: rate });
      },
      setPreservePitch: (on) => {
        audio.setPreservePitch(on);
        set({ preservePitch: on });
      },
      setMe: (me) => set({ me }),
    }),
    {
      name: 'wavebox-player',
      partialize: (s) => {
        // Strip heavy fields (media, waveform, description, publisher_metadata)
        // before persisting to localStorage — saves ~3KB per track
        const slim = (t: ScTrack) => ({
          id: t.id,
          title: t.title,
          artwork_url: t.artwork_url,
          duration: t.duration,
          full_duration: t.full_duration,
          playback_count: t.playback_count,
          user: t.user ? { id: t.user.id, username: t.user.username, avatar_url: t.user.avatar_url } : t.user,
        }) as ScTrack;
        return {
          volume: s.volume,
          muted: s.muted,
          shuffle: s.shuffle,
          repeat: s.repeat,
          eqEnabled: s.eqEnabled,
          eqGains: s.eqGains,
          speed: s.speed,
          preservePitch: s.preservePitch,
          likes: s.likes.map(slim),
          likedPlaylists: s.likedPlaylists.map((p) => ({
            id: p.id, kind: p.kind, title: p.title, permalink_url: p.permalink_url,
            duration: p.duration, artwork_url: p.artwork_url, is_album: p.is_album,
            track_count: p.track_count,
            user: p.user ? { id: p.user.id, username: p.user.username, avatar_url: p.user.avatar_url } : p.user,
          }) as ScPlaylist),
          recentPlays: s.recentPlays.map(slim),
        };
      },
    },
  ),
);

/* ---------- wire audio engine -> store ---------- */
audio.on((e) => {
  const s = usePlayer.getState();
  switch (e.type) {
    case 'time':
      usePlayer.setState({ position: e.current, duration: e.duration });
      // Throttled RPC update
      if (s.current && Math.floor(e.current) % 15 === 0) {
        window.wavebox.rpc
          .set({
            title: s.current.title,
            artist: s.current.user.username,
            artwork: s.current.artwork_url,
            durationMs: (s.current.full_duration ?? s.current.duration),
            positionMs: Math.floor(e.current * 1000),
          })
          .catch(() => {});
      }
      break;
    case 'play':
      usePlayer.setState({ isPlaying: true, isLoading: false });
      break;
    case 'pause':
      usePlayer.setState({ isPlaying: false });
      break;
    case 'loading':
      usePlayer.setState({ isLoading: true });
      break;
    case 'ready':
      usePlayer.setState({ isLoading: false });
      audio.setVolume(s.muted ? 0 : s.volume);
      s.eqGains.forEach((g, i) => audio.setEqGain(i, s.eqEnabled ? g : 0));
      audio.setSpeed(s.speed);
      audio.setPreservePitch(s.preservePitch);
      break;
    case 'ended':
      usePlayer.setState({ isPlaying: false });
      void s.next();
      break;
    case 'error':
      usePlayer.setState({ isPlaying: false, isLoading: false });
      break;
  }
});

/* ---------- wire media keys ---------- */
window.wavebox.onMedia((e) => {
  const s = usePlayer.getState();
  if (e === 'playpause') void s.toggle();
  else if (e === 'next') void s.next();
  else if (e === 'prev') void s.prev();
  else if (e === 'stop') {
    audio.pause();
    audio.seek(0);
  }
});

/* ---------- MediaSession handlers (Windows SMTC + OS overlays) ---------- */
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => void usePlayer.getState().toggle());
  navigator.mediaSession.setActionHandler('pause', () => void usePlayer.getState().toggle());
  navigator.mediaSession.setActionHandler('previoustrack', () => void usePlayer.getState().prev());
  navigator.mediaSession.setActionHandler('nexttrack', () => void usePlayer.getState().next());
  navigator.mediaSession.setActionHandler('seekto', (d) => {
    if (d.seekTime != null) usePlayer.getState().seek(d.seekTime);
  });
}
