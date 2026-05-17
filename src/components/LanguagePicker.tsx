import { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES, useI18n, type LanguageCode } from '@/lib/i18n';
import { cn } from '@/lib/format';

export function LanguagePicker() {
  const lang = useI18n((s) => s.language);
  const setLang = useI18n((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const choose = (code: LanguageCode) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass glass-specular w-full px-3 py-2.5 flex items-center gap-2.5 text-sm transition will-change-transform hover:-translate-y-px"
        style={{ transitionDuration: '220ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <Globe size={15} className="text-text-dim relative z-10" />
        <span className="relative z-10 text-base leading-none">{current.flag}</span>
        <span className="relative z-10 flex-1 text-left truncate font-medium">{current.native}</span>
        <ChevronDown
          size={14}
          className={cn('relative z-10 text-text-mute transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 right-0 glass-floating glass-specular max-h-80 overflow-y-auto p-1.5 z-50 animate-scale-in"
          style={{ transformOrigin: 'bottom center' }}
        >
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => choose(l.code)}
                className={cn(
                  'relative z-10 w-full px-3 py-2 flex items-center gap-2.5 text-sm rounded-xl transition',
                  'hover:bg-white/[0.07]',
                  active && 'bg-white/[0.05]',
                )}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 text-left truncate">{l.native}</span>
                {active && <Check size={14} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
