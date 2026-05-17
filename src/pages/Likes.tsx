import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '@/lib/store';
import { api, artwork, playlistArtwork } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { PageHeader } from '@/components/PageHeader';
import { Heart } from 'lucide-react';
import type { ScTrack, ScPlaylist } from '@/types/soundcloud';
import { useT } from '@/lib/i18n';

type Tab = 'songs' | 'playlists' | 'albums';

export function Likes() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('songs');
  const localLikes = usePlayer((s) => s.likes);
  const localPlaylistLikes = usePlayer((s) => s.likedPlaylists);
  const me = usePlayer((s) => s.me);
  const [scLikes, setScLikes] = useState<ScTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    api
      .myLikes(80)
      .then((r) => {
        setScLikes(
          (r.collection ?? []).map((c: any) => c.track ?? c).filter((t: any) => t?.id),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [me]);

  const mergedTracks: ScTrack[] = [
    ...scLikes,
    ...localLikes.filter((l) => !scLikes.some((s) => s.id === l.id)),
  ];

  const mergedPlaylists = localPlaylistLikes.filter((l) => !l.is_album);
  const mergedAlbums = localPlaylistLikes.filter((l) => l.is_album);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'songs', label: t('likes.songs'), count: mergedTracks.length },
    { key: 'playlists', label: t('likes.playlists'), count: mergedPlaylists.length },
    { key: 'albums', label: t('likes.albums'), count: mergedAlbums.length },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={t('likes.title')}
        subtitle={me ? t('likes.subSynced', { count: mergedTracks.length }) : t('likes.subLocal', { count: localLikes.length })}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-5">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === tb.key
                ? 'bg-accent text-white'
                : 'bg-white/5 text-text-dim hover:bg-white/10 hover:text-text'
            }`}
          >
            {tb.label}
            <span className="ml-1.5 opacity-60">{tb.count}</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-text-mute mb-3">{t('likes.loading')}</p>}

      {/* Songs tab */}
      {tab === 'songs' && <TrackList tracks={mergedTracks} />}

      {/* Playlists tab */}
      {tab === 'playlists' && (
        <PlaylistGrid items={mergedPlaylists} emptyText={t('likes.emptyPlaylists')} />
      )}

      {/* Albums tab */}
      {tab === 'albums' && (
        <PlaylistGrid items={mergedAlbums} emptyText={t('likes.emptyAlbums')} />
      )}
    </div>
  );
}

function PlaylistGrid({ items, emptyText }: { items: ScPlaylist[]; emptyText: string }) {
  const togglePlaylistLike = usePlayer((s) => s.togglePlaylistLike);
  const likedPlaylists = usePlayer((s) => s.likedPlaylists);
  const isLiked = useCallback((id: number) => likedPlaylists.some((l) => l.id === id), [likedPlaylists]);

  if (!items.length) return <p className="text-text-mute">{emptyText}</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((p) => (
        <div key={p.id} className="group glass glass-specular p-3 flex flex-col gap-3">
          <Link to={`/playlist/${p.id}`}>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10">
              {playlistArtwork(p) ? (
                <img
                  src={playlistArtwork(p) ?? undefined}
                  className="w-full h-full object-cover"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent/40 to-bg-hover" />
              )}
            </div>
          </Link>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/playlist/${p.id}`} className="min-w-0">
              <div className="text-sm font-medium truncate">{p.title}</div>
              <div className="text-xs text-text-dim truncate">{p.user?.username}</div>
            </Link>
            <button
              onClick={() => togglePlaylistLike(p)}
              className="shrink-0 mt-0.5"
            >
              <Heart
                size={14}
                className={isLiked(p.id) ? 'text-accent fill-accent' : 'text-text-dim'}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
