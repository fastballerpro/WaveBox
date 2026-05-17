import { usePlayer } from '@/lib/store';
import { TrackList } from '@/components/TrackList';
import { PageHeader } from '@/components/PageHeader';
import { useT } from '@/lib/i18n';

export function History() {
  const t = useT();
  const recent = usePlayer((s) => s.recentPlays);
  return (
    <div className="p-6">
      <PageHeader
        title={t('history.title')}
        subtitle={t('history.subtitle', { count: recent.length })}
      />
      <TrackList tracks={recent} />
    </div>
  );
}
