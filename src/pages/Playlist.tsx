import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, Heart } from 'lucide-react';
import { api, playlistArtwork } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { usePlayer } from '@/lib/store';
import { formatDuration } from '@/lib/format';
import type { ScPlaylist, ScTrack } from '@/types/soundcloud';
import { useT } from '@/lib/i18n';

export function PlaylistPage() {
  const t = useT();
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<ScPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const togglePlaylistLike = usePlayer((s) => s.togglePlaylistLike);
  const liked = usePlayer((s) => s.likedPlaylists.some((l) => l.id === Number(id)));

  const [tracks, setTracks] = useState<ScTrack[]>([]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    api
      .playlist(Number(id))
      .then(async (p) => {
        if (!alive) return;
        setPlaylist(p);
        const raw = (p.tracks ?? []).filter((t: any) => t?.id);
        // SC returns some tracks as stubs (only id, no title). Resolve them.
        const stubs = raw.filter((t: any) => !t.title);
        const full = raw.filter((t: any) => t.title);
        if (stubs.length) {
          const resolved = await Promise.all(
            stubs.map((s: any) => api.track(s.id).catch(() => null)),
          );
          const all = [
            ...full,
            ...resolved.filter(Boolean),
          ].sort((a, b) => {
            const ai = raw.findIndex((r: any) => r.id === a!.id);
            const bi = raw.findIndex((r: any) => r.id === b!.id);
            return ai - bi;
          });
          if (alive) setTracks(all as ScTrack[]);
        } else {
          if (alive) setTracks(full as ScTrack[]);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div className="p-6 text-text-mute">{t('playlist.loading')}</div>;
  if (!playlist) return <div className="p-6 text-text-mute">{t('playlist.notFound')}</div>;

  return (
    <div className="p-6">
      <div className="flex gap-6 items-end mb-8">
        <div className="w-56 h-56 rounded-xl overflow-hidden bg-bg-hover shadow-glow">
          {playlistArtwork(playlist) && (
            <img
              src={playlistArtwork(playlist) ?? undefined}
              className="w-full h-full object-cover"
              alt=""
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-text-mute mb-2">
            {playlist.is_album ? t('playlist.album') : t('playlist.playlist')}
          </div>
          <h1 className="text-4xl font-bold mb-2">{playlist.title}</h1>
          <Link
            to={`/artist/${playlist.user.id}`}
            className="text-sm text-text-dim hover:text-text"
          >
            {playlist.user.username}
          </Link>
          <div className="text-xs text-text-mute mt-1">
            {t('playlist.tracksCount', { count: playlist.track_count })} · {formatDuration(playlist.duration)}
          </div>
          <div className="flex gap-3 mt-4">
            {(() => {
              const playingFromHere = isPlaying && current && tracks.some((t) => t.id === current.id);
              return (
                <button
                  onClick={() => {
                    if (playingFromHere) toggle();
                    else if (tracks[0]) play(tracks[0], tracks);
                  }}
                  className="btn btn-primary"
                  disabled={!tracks.length}
                >
                  {playingFromHere ? <Pause size={14} /> : <Play size={14} />}
                  {playingFromHere ? t('player.pause') : t('playlist.play')}
                </button>
              );
            })()}
            <button
              onClick={() => playlist && togglePlaylistLike(playlist)}
              className="btn btn-glass"
            >
              <Heart
                size={14}
                className={liked ? 'text-accent fill-accent' : ''}
              />
            </button>
          </div>
        </div>
      </div>

      <TrackList tracks={tracks} />
    </div>
  );
}
