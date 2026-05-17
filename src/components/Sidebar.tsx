import { NavLink } from 'react-router-dom';
import {
  Home,
  Search,
  Heart,
  Clock,
  Settings as SettingsIcon,
  LogIn,
  LogOut,
} from 'lucide-react';
import { usePlayer } from '@/lib/store';
import { artwork } from '@/lib/api';
import { cn } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { LanguagePicker } from './LanguagePicker';

const NAV = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/search', key: 'nav.search', icon: Search },
  { to: '/likes', key: 'nav.likes', icon: Heart },
  { to: '/history', key: 'nav.history', icon: Clock },
] as const;

export function Sidebar() {
  const me = usePlayer((s) => s.me);
  const setMe = usePlayer((s) => s.setMe);
  const t = useT();

  const login = async () => {
    const { me } = await window.wavebox.auth.login();
    setMe(me ?? null);
  };
  const logout = async () => {
    await window.wavebox.auth.logout();
    setMe(null);
  };

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex items-center gap-3 px-3 py-2 rounded-2xl text-sm transition',
      'hover:text-text',
      isActive ? 'text-text' : 'text-text-dim',
    );

  return (
    <aside className="w-64 shrink-0 glass-chrome flex flex-col relative z-20 border-r border-white/5">
      <nav className="p-3 pt-4 flex flex-col gap-1">
        {NAV.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={itemClass}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)',
                    }}
                  />
                )}
                <Icon
                  size={16}
                  className={cn('relative z-10', isActive && 'text-accent')}
                />
                <span className="relative z-10">{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 mt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-mute px-3 mb-1.5">
          {t('nav.account')}
        </div>
        <NavLink to="/settings" className={itemClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)',
                  }}
                />
              )}
              <SettingsIcon
                size={16}
                className={cn('relative z-10', isActive && 'text-accent')}
              />
              <span className="relative z-10">{t('nav.settings')}</span>
            </>
          )}
        </NavLink>
      </div>

      <div className="mt-auto p-3 flex flex-col gap-2">
        <LanguagePicker />

        {me ? (
          <div className="glass glass-specular p-3 flex items-center gap-3">
            {me.avatar_url ? (
              <img
                src={artwork(me.avatar_url, 't120x120') ?? undefined}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/15"
                alt=""
                decoding="async"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10" />
            )}
            <div className="flex-1 min-w-0 relative z-10">
              <div className="text-sm font-medium truncate">{me.username}</div>
              <div className="text-xs text-text-mute truncate">{t('auth.signedIn')}</div>
            </div>
            <button
              onClick={logout}
              title={t('auth.signOut')}
              className="btn btn-ghost !p-2 !rounded-full relative z-10"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button onClick={login} className="btn btn-primary w-full !py-2.5">
            <LogIn size={14} />
            {t('auth.signIn')}
          </button>
        )}
      </div>
    </aside>
  );
}
