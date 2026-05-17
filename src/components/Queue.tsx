import { ListMusic, Trash2, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { usePlayer } from '@/lib/store';
import { artwork } from '@/lib/api';
import { cn, formatDuration } from '@/lib/format';

export function Queue({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const remove = usePlayer((s) => s.removeFromQueue);
  const clearQueue = usePlayer((s) => s.clearQueue);
  const play = usePlayer((s) => s.play);

  return (
    <aside
      className={cn(
        'absolute top-3 right-3 bottom-3 w-96 glass-floating transform transition-transform z-30 overflow-hidden',
        open ? 'translate-x-0' : 'translate-x-[110%]',
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', transitionDuration: '320ms' }}
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ListMusic size={16} />
          <h3 className="text-sm font-semibold">{t('queue.title')}</h3>
          <span className="text-xs text-text-mute">{queue.length}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={clearQueue} title={t('queue.clear')} className="btn btn-ghost !p-2 !rounded-full">
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="btn btn-ghost !p-2 !rounded-full">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-3rem)] p-2">
        {queue.length === 0 ? (
          <div className="text-text-mute text-sm text-center py-8">{t('queue.empty')}</div>
        ) : (
          queue.map((tr, i) => (
            <div
              key={`${tr.id}-${i}`}
              className={cn(
                'group flex items-center gap-3 p-2 row-hover',
                i === index && 'bg-white/[0.07]',
              )}
            >
              <button onClick={() => play(tr, queue)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 shrink-0">
                  {tr.artwork_url && (
                    <img
                      src={artwork(tr.artwork_url, 't120x120') ?? undefined}
                      className="w-full h-full object-cover"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className={cn('text-sm truncate', i === index && 'text-accent')}>
                    {tr.title}
                  </div>
                  <div className="text-xs text-text-dim truncate">{tr.user?.username ?? t('track.unknown')}</div>
                </div>
              </button>
              <span className="text-[11px] text-text-mute tabular-nums">
                {formatDuration(tr.full_duration ?? tr.duration)}
              </span>
              <button
                onClick={() => remove(i)}
                className="opacity-0 group-hover:opacity-100 btn btn-ghost p-1.5"
                title={t('queue.remove')}
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
