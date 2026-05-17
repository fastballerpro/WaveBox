import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrackCard } from '@/components/TrackCard';
import { PageHeader } from '@/components/PageHeader';
import { usePlayer } from '@/lib/store';
import type { ScTrack } from '@/types/soundcloud';
import { useT } from '@/lib/i18n';

export function Home() {
  const t = useT();
  const likes = usePlayer((s) => s.likes);
  const recentPlays = usePlayer((s) => s.recentPlays);
  const me = usePlayer((s) => s.me);

  const [forYou, setForYou] = useState<ScTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const norm = (r: any): ScTrack[] => {
      let items = r?.collection ?? [];
      if (items.length && items[0]?.items?.collection) {
        items = items.flatMap((s: any) =>
          (s.items?.collection ?? []).map((c: any) => c.track ?? c),
        );
      }
      return items
        .map((c: any) => c.track ?? c)
        .filter((t: any) => t?.id && t?.user?.id);
    };

    // Fetch SC account likes as seeds too (if logged in)
    const scLikesPromise = me
      ? api.myLikes(50).then((r) =>
          (r.collection ?? []).map((c: any) => (c.track ?? c)?.id).filter(Boolean),
        ).catch(() => [] as number[])
      : Promise.resolve([] as number[]);

    scLikesPromise.then((scLikeIds) => {
      if (!alive) return;
      const seedIds = [...new Set([
        ...scLikeIds,
        ...likes.map((t) => t.id),
        ...recentPlays.map((t) => t.id),
      ])];

      return api.recommendations(seedIds.length ? seedIds : [], 50)
        .then((r) => {
          if (!alive) return;
          setForYou(norm(r));
        });
    })
      .catch((e) => console.error('[Home]', e))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [likes.length, recentPlays.length, me?.id]);

  return (
    <div className="p-6">
      <PageHeader title={t('nav.home')} subtitle={t('home.subtitle')} />

      {loading ? (
        <Skeletons />
      ) : (
        <Section title={t('home.forYou')} tracks={forYou} />
      )}
    </div>
  );
}

function Section({ title, tracks }: { title: string; tracks: ScTrack[] }) {
  if (!tracks.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {tracks.map((t) => (
          <TrackCard key={t.id} track={t} queue={tracks} />
        ))}
      </div>
    </section>
  );
}

function Skeletons() {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="card p-3 flex flex-col gap-3 animate-pulse">
          <div className="aspect-square bg-bg-hover rounded-lg" />
          <div className="h-3 bg-bg-hover rounded w-3/4" />
          <div className="h-3 bg-bg-hover rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
