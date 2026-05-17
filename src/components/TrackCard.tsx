import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ScTrack } from '@/types/soundcloud';
import { artwork } from '@/lib/api';
import { usePlayer } from '@/lib/store';
import { formatNumber } from '@/lib/format';
import { useT } from '@/lib/i18n';

export function TrackCard({ track, queue }: { track: ScTrack; queue?: ScTrack[] }) {
  const play = usePlayer((s) => s.play);
  const t = useT();

  return (
    <div
      className="group glass glass-specular p-3 cursor-default flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-glass-lg"
      style={{ transitionDuration: '260ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10">
        {track.artwork_url ? (
          <img
            src={artwork(track.artwork_url, 't200x200') ?? undefined}
            className="w-full h-full object-cover"
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/40 to-bg-hover" />
        )}
        <button
          onClick={() => play(track, queue)}
          className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full grid place-items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition"
          style={{
            background: 'linear-gradient(180deg, #ff7733 0%, #ff5500 100%)',
            boxShadow:
              '0 12px 28px rgba(255,85,0,0.55), inset 0 1px 0 rgba(255,255,255,0.36), inset 0 -1px 0 rgba(0,0,0,0.2)',
            transitionDuration: '260ms',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <Play size={16} fill="currentColor" className="text-white translate-x-0.5" />
        </button>
      </div>
      <div className="min-w-0">
        <button
          onClick={() => play(track, queue)}
          className="block text-sm font-medium truncate text-left w-full hover:underline"
        >
          {track.title}
        </button>
        <div className="flex items-center justify-between mt-1">
          {track.user?.id ? (
            <Link
              to={`/artist/${track.user.id}`}
              className="text-xs text-text-dim hover:text-text truncate"
            >
              {track.user.username}
            </Link>
          ) : (
            <span className="text-xs text-text-mute truncate">
              {track.user?.username ?? t('track.unknown')}
            </span>
          )}
          {track.playback_count != null && (
            <span className="text-[10px] text-text-mute tabular-nums shrink-0 ml-2">
              {formatNumber(track.playback_count)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
