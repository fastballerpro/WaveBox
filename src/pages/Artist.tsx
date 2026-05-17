import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, artwork, playlistArtwork } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { formatNumber } from '@/lib/format';
import type { ScTrack, ScUser, ScPlaylist } from '@/types/soundcloud';
import { useT } from '@/lib/i18n';

export function ArtistPage() {
  const t = useT();
  const { id } = useParams();
  const [user, setUser] = useState<ScUser | null>(null);
  const [tracks, setTracks] = useState<ScTrack[]>([]);
  const [playlists, setPlaylists] = useState<ScPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    Promise.all([api.user(Number(id)), api.userTracks(Number(id), 30), api.userPlaylists(Number(id), 12)])
      .then(([u, t, p]) => {
        if (!alive) return;
        setUser(u);
        setTracks((t.collection ?? []) as ScTrack[]);
        setPlaylists((p.collection ?? []) as ScPlaylist[]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div className="p-6 text-text-mute">{t('artist.loading')}</div>;
  if (!user) return <div className="p-6 text-text-mute">{t('artist.notFound')}</div>;

  return (
    <div>
      <div className="relative h-56 bg-gradient-to-br from-accent/40 via-bg-card to-bg-soft">
        <div className="absolute -bottom-12 left-6 flex items-end gap-5">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-bg shadow-glow bg-bg-hover">
            {user.avatar_url && (
              <img
                src={artwork(user.avatar_url, 't500x500') ?? undefined}
                className="w-full h-full object-cover"
                alt=""
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className="pb-4">
            <h1 className="text-3xl font-bold">{user.username}</h1>
            <div className="text-sm text-text-dim mt-1">
              {t('artist.followers', { count: formatNumber(user.followers_count) })} ·{' '}
              {[user.city, user.country_code].filter(Boolean).join(', ') || 'SoundCloud'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-16 pb-8">
        <h2 className="text-lg font-semibold mb-3">{t('artist.topTracks')}</h2>
        <TrackList tracks={tracks} />

        {playlists.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mt-10 mb-3">{t('artist.playlists')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlists.map((p) => (
                <Link
                  key={p.id}
                  to={`/playlist/${p.id}`}
                  className="card p-3 flex flex-col gap-3 hover:bg-bg-hover transition"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-bg-hover">
                    {playlistArtwork(p) && (
                      <img
                        src={playlistArtwork(p) ?? undefined}
                        className="w-full h-full object-cover"
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <div className="text-sm font-medium truncate">{p.title}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
