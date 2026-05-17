import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, artwork, playlistArtwork } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/format';
import type { ScTrack } from '@/types/soundcloud';
import { useT } from '@/lib/i18n';

type Tab = 'tracks' | 'users' | 'playlists' | 'albums';
const TABS: { id: Tab; key: string }[] = [
  { id: 'tracks', key: 'search.tracks' },
  { id: 'users', key: 'search.artists' },
  { id: 'playlists', key: 'search.playlists' },
  { id: 'albums', key: 'search.albums' },
];

export function Search() {
  const t = useT();
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [tab, setTab] = useState<Tab>('tracks');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    let alive = true;
    setLoading(true);
    api
      .search(q, tab, 40)
      .then((r) => alive && setData(r.collection ?? []))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, tab]);

  return (
    <div className="p-6">
      <PageHeader
        title={q ? t('search.for', { q }) : t('search.title')}
        subtitle={t('search.subtitle')}
      />

      <div className="flex gap-2 mb-6">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.id}
            onClick={() => setTab(tabDef.id)}
            className={cn(
              'btn text-xs !py-1.5 !px-3.5',
              tab === tabDef.id ? 'btn-primary' : 'btn-glass',
            )}
          >
            {t(tabDef.key)}
          </button>
        ))}
      </div>

      {!q ? (
        <p className="text-text-mute">{t('search.prompt')}</p>
      ) : loading ? (
        <p className="text-text-mute">{t('common.loading')}</p>
      ) : !data.length ? (
        <p className="text-text-mute">{t('search.noResults')}</p>
      ) : tab === 'tracks' ? (
        <TrackList tracks={data as ScTrack[]} />
      ) : tab === 'users' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((u) => (
            <Link
              key={u.id}
              to={`/artist/${u.id}`}
              className="card p-4 flex flex-col items-center text-center hover:bg-bg-hover transition"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-bg-hover mb-3">
                {u.avatar_url && (
                  <img
                    src={artwork(u.avatar_url, 't200x200') ?? undefined}
                    className="w-full h-full object-cover"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
              <div className="text-sm font-medium truncate w-full">{u.username}</div>
              <div className="text-xs text-text-mute">
                {t('artist.followers', { count: (u.followers_count ?? 0).toLocaleString() })}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((p) => (
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
              <div>
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-text-dim truncate">{p.user?.username}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
