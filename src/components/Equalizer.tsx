import { usePlayer } from '@/lib/store';
import { EQ_FREQUENCIES } from '@/lib/audio';
import { cn } from '@/lib/format';
import { useT } from '@/lib/i18n';

const PRESETS: Record<string, number[]> = {
  Flat:    [0, 0, 0, 0, 0, 0, 0, 0],
  Bass:    [6, 4, 2, 0, 0, 0, 0, 0],
  Vocal:   [-2, -1, 1, 3, 4, 3, 1, 0],
  Treble:  [0, 0, 0, 0, 1, 3, 5, 6],
  Loud:    [4, 3, 0, 0, 0, 0, 3, 4],
};

export function Equalizer() {
  const t = useT();
  const enabled = usePlayer((s) => s.eqEnabled);
  const gains = usePlayer((s) => s.eqGains);
  const setGain = usePlayer((s) => s.setEqGain);
  const setEnabled = usePlayer((s) => s.setEqEnabled);
  const reset = usePlayer((s) => s.resetEq);

  const applyPreset = (name: keyof typeof PRESETS) => {
    PRESETS[name].forEach((g, i) => setGain(i, g));
    if (!enabled) setEnabled(true);
  };

  return (
    <div className="glass-floating glass-specular p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{t('eq.title')}</h2>
          <p className="text-xs text-text-mute mt-0.5">{t('eq.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="btn btn-ghost text-xs"
          >
            {t('eq.reset')}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-accent"
            />
            {t('eq.enabled')}
          </label>
        </div>
      </div>

      <div className="flex items-end gap-4 h-56">
        {EQ_FREQUENCIES.map((freq, i) => (
          <div key={freq} className="flex-1 flex flex-col items-center gap-2 h-full">
            <span className="text-[10px] text-text-mute tabular-nums">
              {gains[i] > 0 ? '+' : ''}
              {gains[i].toFixed(1)} dB
            </span>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={gains[i]}
              onChange={(e) => setGain(i, Number(e.target.value))}
              className={cn(
                'h-full w-1 appearance-none bg-border rounded-full cursor-pointer',
                '[writing-mode:bt-lr] [-webkit-appearance:slider-vertical]',
                !enabled && 'opacity-40',
              )}
              style={{ writingMode: 'vertical-lr' as any }}
            />
            <span className="text-[10px] text-text-dim">
              {freq >= 1000 ? `${freq / 1000}k` : freq}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => applyPreset(name as keyof typeof PRESETS)}
            className="btn btn-glass !py-1.5 !px-3 text-xs"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
