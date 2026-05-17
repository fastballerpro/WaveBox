import { Heart, Pause, Play, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ScTrack } from '@/types/soundcloud';
import { artwork } from '@/lib/api';
import { usePlayer } from '@/lib/store';
import { formatDuration, formatNumber, cn } from '@/lib/format';
import { useT } from '@/lib/i18n';

interface Props {
  track: ScTrack;
  index?: number;
  queue?: ScTrack[];
  showArt?: boolean;
}

export function TrackRow({ track, index, queue, showArt = true }: Props) {
  const t = useT();
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const enqueue = usePlayer((s) => s.enqueue);
  const liked = usePlayer((s) => s.isLiked(track.id));
  const toggleLike = usePlayer((s) => s.toggleLike);

  const isCurrent = current?.id === track.id;
  const showPause = isCurrent && isPlaying;

  const handlePlay = () => {
    if (isCurrent) {
      void toggle();
    } else {
      void play(track, queue);
    }
  };

  return (
    <div
      className={cn(
        'group grid items-center gap-3 px-3 py-2 row-hover',
        showArt
          ? 'grid-cols-[20px_48px_1fr_120px_64px_56px]'
          : 'grid-cols-[20px_1fr_120px_64px_56px]',
        isCurrent && 'bg-white/[0.06]',
      )}
    >
      <div className="text-text-mute text-xs text-center">
        <span className="group-hover:hidden">{(index ?? 0) + 1}</span>
        <button onClick={handlePlay} className="hidden group-hover:inline-flex text-text">
          {showPause ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
      </div>

      {showArt && (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
          {track.artwork_url ? (
            <img
              src={artwork(track.artwork_url, 't120x120') ?? undefined}
              className="w-full h-full object-cover"
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
      )}

      <div className="min-w-0">
        <button
          onClick={handlePlay}
          className={cn(
            'block text-sm font-medium truncate text-left hover:underline',
            isCurrent && 'text-accent',
          )}
        >
          {track.title}
        </button>
        {track.user?.id ? (
          <Link
            to={`/artist/${track.user.id}`}
            className="text-xs text-text-dim hover:text-text truncate block"
          >
            {track.user.username}
          </Link>
        ) : (
          <span className="text-xs text-text-mute truncate block">
            {track.user?.username ?? t('track.unknown')}
          </span>
        )}
      </div>

      <div className="text-xs text-text-mute truncate">
        {t('track.plays', { count: formatNumber(track.playback_count) })}
      </div>

      <div className="text-xs text-text-mute text-right tabular-nums">
        {formatDuration(track.full_duration ?? track.duration)}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => toggleLike(track)}
          className={cn(
            'btn-ghost p-1.5 rounded-md',
            liked && 'text-accent hover:text-accent',
          )}
          title={liked ? 'Unlike' : 'Like'}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => enqueue(track)}
          className="btn-ghost p-1.5 rounded-md"
          title="Add to queue"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
