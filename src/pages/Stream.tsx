import { useEffect, useState } from 'react';
import { usePlayer } from '@/lib/store';
import { api } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { PageHeader } from '@/components/PageHeader';
import type { ScTrack } from '@/types/soundcloud';
import { useT } from '@/lib/i18n';

export function Stream() {
  const t = useT();
  const me = usePlayer((s) => s.me);
  const [tracks, setTracks] = useState<ScTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    api
      .myStream(60)
      .then((r) => {
        const items: ScTrack[] = (r.collection ?? [])
          .map((c: any) => c.track ?? c.playlist?.tracks?.[0] ?? c)
          .filter((t: any) => t?.kind === 'track' && t?.id);
        setTracks(items);
      })
      .finally(() => setLoading(false));
  }, [me]);

  return (
    <div className="p-6">
      <PageHeader
        title={t('stream.title')}
        subtitle={me ? t('stream.subSignedIn') : t('stream.subSignedOut')}
      />
      {!me ? (
        <p className="text-text-mute">{t('stream.prompt')}</p>
      ) : loading ? (
        <p className="text-text-mute">{t('stream.loading')}</p>
      ) : (
        <TrackList tracks={tracks} />
      )}
    </div>
  );
}
