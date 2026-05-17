import { Minus, Square, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/lib/i18n';

export function Titlebar() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const t = useT();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="draggable glass-chrome h-12 flex items-center justify-between pl-4 pr-1 select-none relative z-30">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg grid place-items-center"
          style={{
            background: 'linear-gradient(135deg, #ff8a3d 0%, #ff5500 100%)',
            boxShadow: '0 2px 8px rgba(255,85,0,0.4)',
          }}
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="white">
            <rect x="1" y="9" width="1.5" height="4" rx="0.75" />
            <rect x="3.5" y="7" width="1.5" height="6" rx="0.75" />
            <rect x="6" y="4" width="1.5" height="9" rx="0.75" />
            <rect x="8.5" y="2" width="1.5" height="11" rx="0.75" />
            <rect x="11" y="5" width="1.5" height="8" rx="0.75" />
            <rect x="13.5" y="7" width="1.5" height="6" rx="0.75" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-wide">SoundCloud</span>
      </div>

      <form onSubmit={submit} className="no-drag flex-1 max-w-xl mx-6">
        <label className="pill-input flex items-center gap-2 px-4 h-9">
          <Search size={14} className="text-text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-mute"
          />
        </label>
      </form>

      <div className="no-drag flex items-center gap-1 pr-1">
        <button
          onClick={() => window.wavebox.window.minimize()}
          className="w-9 h-9 grid place-items-center rounded-full text-text-dim hover:text-text hover:bg-white/10 transition"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.wavebox.window.maximize()}
          className="w-9 h-9 grid place-items-center rounded-full text-text-dim hover:text-text hover:bg-white/10 transition"
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => window.wavebox.window.close()}
          className="w-9 h-9 grid place-items-center rounded-full text-text-dim hover:bg-red-500 hover:text-white transition"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
