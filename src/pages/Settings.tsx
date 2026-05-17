import { usePlayer } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { useT } from '@/lib/i18n';

export function Settings() {
  const t = useT();
  const me = usePlayer((s) => s.me);
  const setMe = usePlayer((s) => s.setMe);

  const login = async () => {
    const { me } = await window.wavebox.auth.login();
    setMe(me ?? null);
  };
  const logout = async () => {
    await window.wavebox.auth.logout();
    setMe(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <section className="card p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('auth.title')}</h2>
        {me ? (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {t('auth.signedInAs', { name: me.username })}
            </div>
            <button onClick={logout} className="btn btn-glass">
              {t('auth.signOut')}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-text-dim">{t('auth.description')}</p>
            <button onClick={login} className="btn btn-primary shrink-0">
              {t('auth.signIn')}
            </button>
          </div>
        )}
      </section>

      <section className="card p-5 mt-6 text-xs text-text-mute leading-relaxed">
        <h3 className="text-sm font-semibold text-text mb-2">{t('settings.aboutTitle')}</h3>
        <p>{t('settings.aboutText1')}</p>
        <p className="mt-2">{t('settings.aboutText2')}</p>
      </section>
    </div>
  );
}
