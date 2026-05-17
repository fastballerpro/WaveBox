import { useState, useRef, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { usePlayer } from '@/lib/store';
import { cn } from '@/lib/format';

const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function SpeedControl() {
  const speed = usePlayer((s) => s.speed);
  const preservePitch = usePlayer((s) => s.preservePitch);
  const setSpeed = usePlayer((s) => s.setSpeed);
  const setPreservePitch = usePlayer((s) => s.setPreservePitch);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('btn btn-ghost p-2', speed !== 1 && 'text-accent')}
        title="Playback Speed"
      >
        <Gauge size={16} />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 glass-floating p-4 rounded-2xl w-64 animate-scale-in"
          style={{ zIndex: 60 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Speed</span>
            <span className="text-sm font-bold text-accent">{speed.toFixed(2)}x</span>
          </div>

          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="range w-full mb-3"
          />

          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setSpeed(p)}
                className={cn(
                  'text-xs px-2 py-1 rounded-lg transition',
                  Math.abs(speed - p) < 0.01
                    ? 'bg-accent text-white'
                    : 'bg-white/10 hover:bg-white/15 text-text-dim',
                )}
              >
                {p}x
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-text-dim cursor-pointer">
            <input
              type="checkbox"
              checked={preservePitch}
              onChange={(e) => setPreservePitch(e.target.checked)}
              className="accent-accent w-3.5 h-3.5"
            />
            Preserve pitch
          </label>
        </div>
      )}
    </div>
  );
}
