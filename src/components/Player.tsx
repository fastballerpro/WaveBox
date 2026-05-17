import { useState } from 'react';
import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlayer } from '@/lib/store';
import { artwork } from '@/lib/api';
import { cn, formatDuration } from '@/lib/format';
import { Queue } from './Queue';
import { Equalizer } from './Equalizer';
import { SpeedControl } from './SpeedControl';
import { useT } from '@/lib/i18n';

export function Player() {
  const t = useT();
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isLoading = usePlayer((s) => s.isLoading);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const isLiked = usePlayer((s) => (current ? s.isLiked(current.id) : false));

  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleLike = usePlayer((s) => s.toggleLike);

  const [queueOpen, setQueueOpen] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const safeDuration = duration || (current ? (current.full_duration ?? current.duration) / 1000 : 0);
  const pct = safeDuration ? Math.min(100, (position / safeDuration) * 100) : 0;

  return (
    <>
      {eqOpen && (
        <div
          className="fixed inset-0 z-40 grid place-items-center animate-fade-in"
          style={{
            background: 'rgba(0,0,0,0.6)',
          }}
          onClick={() => setEqOpen(false)}
        >
          <div
            className="w-[640px] max-w-[92vw] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Equalizer />
          </div>
        </div>
      )}

      <div className="relative">
        <Queue open={queueOpen} onClose={() => setQueueOpen(false)} />
      </div>

      <footer className="glass-chrome h-[92px] shrink-0 px-4 flex items-center gap-4 relative z-30 border-t border-white/5">
        {/* Left: now playing */}
        <div className="flex items-center gap-3 w-[280px] shrink-0">
          {current ? (
            <>
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 shrink-0 ring-1 ring-white/10 shadow-glass-sm">
                {current.artwork_url && (
                  <img
                    src={artwork(current.artwork_url, 't200x200') ?? undefined}
                    className="w-full h-full object-cover"
                    alt=""
                    decoding="async"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{current.title}</div>
                {current.user?.id ? (
                  <Link
                    to={`/artist/${current.user.id}`}
                    className="text-xs text-text-dim hover:text-text truncate block"
                  >
                    {current.user.username}
                  </Link>
                ) : (
                  <span className="text-xs text-text-mute truncate block">
                    {current.user?.username ?? t('track.unknown')}
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleLike(current)}
                className={cn(
                  'btn btn-ghost p-2',
                  isLiked && 'text-accent hover:text-accent',
                )}
                title={isLiked ? t('player.unlike') : t('player.like')}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </>
          ) : (
            <div className="text-text-mute text-sm">{t('player.nothingPlaying')}</div>
          )}
        </div>

        {/* Center: controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={cn('btn btn-ghost p-1.5', shuffle && 'text-accent')}
              title={t('player.shuffle')}
            >
              <Shuffle size={16} />
            </button>
            <button onClick={prev} className="btn btn-ghost p-2" title={t('player.prev')}>
              <SkipBack size={18} />
            </button>
            <button
              onClick={toggle}
              className="btn btn-primary w-11 h-11 rounded-full !p-0"
              title={isPlaying ? t('player.pause') : t('player.play')}
              disabled={!current}
            >
              {isLoading ? (
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="translate-x-px" />
              )}
            </button>
            <button onClick={next} className="btn btn-ghost p-2" title={t('player.next')}>
              <SkipForward size={18} />
            </button>
            <button
              onClick={cycleRepeat}
              className={cn('btn btn-ghost p-1.5', repeat !== 'off' && 'text-accent')}
              title={t('player.repeat', { mode: t(`player.repeat${repeat[0].toUpperCase()}${repeat.slice(1)}`) })}
            >
              <RepeatIcon size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full max-w-2xl">
            <span className="text-[11px] text-text-mute tabular-nums w-9 text-right">
              {formatDuration(position * 1000)}
            </span>
            <div className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer ring-1 ring-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #ff7733 0%, #ff5500 100%)',
                  boxShadow: '0 0 8px rgba(255,85,0,0.45)',
                }}
              />
              <input
                type="range"
                min={0}
                max={safeDuration || 100}
                step={0.1}
                value={position}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                disabled={!current}
              />
            </div>
            <span className="text-[11px] text-text-mute tabular-nums w-9">
              {formatDuration(safeDuration * 1000)}
            </span>
          </div>
        </div>

        {/* Right: volume + queue + eq */}
        <div className="w-[280px] shrink-0 flex items-center justify-end gap-2">
          <SpeedControl />
          <button
            onClick={() => setEqOpen(true)}
            className="btn btn-ghost p-2"
            title={t('player.equalizer')}
          >
            <Sliders size={16} />
          </button>
          <button
            onClick={() => setQueueOpen((v) => !v)}
            className={cn('btn btn-ghost p-2', queueOpen && 'text-accent')}
            title={t('player.queue')}
          >
            <ListMusic size={16} />
          </button>

          <button onClick={toggleMute} className="btn btn-ghost p-2" title={t('player.mute')}>
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="range w-24"
          />
        </div>
      </footer>
    </>
  );
}
