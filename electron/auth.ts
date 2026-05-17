import { BrowserWindow, session } from 'electron';
import { setOAuthToken } from './soundcloud';

const SC_HOME = 'https://soundcloud.com/signin';

/**
 * Open a window that loads the real SoundCloud sign-in page. Once the user
 * logs in, SC sets an `oauth_token` cookie on the soundcloud.com domain.
 * We watch cookies, capture the token, then close the window.
 */
export async function loginWithSoundCloud(_parent?: BrowserWindow): Promise<string | null> {
  return new Promise(async (resolve) => {
    // We intentionally do NOT pass `parent` here: a child window combined
    // with `frame: false` on the main window can hide/blank the parent on
    // Windows when the child closes. Make this an independent window instead.
    const win = new BrowserWindow({
      width: 480,
      height: 720,
      title: 'SoundCloud Sign-in',
      backgroundColor: '#0b0b0d',
      autoHideMenuBar: true,
      webPreferences: {
        partition: 'persist:soundcloud',
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    await win.loadURL(SC_HOME);

    let resolved = false;
    const finish = (token: string | null) => {
      if (resolved) return;
      resolved = true;
      setOAuthToken(token);
      try {
        win.close();
      } catch {}
      resolve(token);
    };

    const ses = session.fromPartition('persist:soundcloud');

    const tryCapture = async () => {
      const cookies = await ses.cookies.get({ domain: '.soundcloud.com' });
      const tok = cookies.find((c) => c.name === 'oauth_token');
      if (tok?.value) finish(tok.value);
    };

    const onChanged = () => {
      tryCapture();
    };
    ses.cookies.on('changed', onChanged);

    win.on('closed', () => {
      ses.cookies.removeListener('changed', onChanged);
      if (!resolved) resolve(null);
    });

    // Initial check (already signed-in case)
    tryCapture();
  });
}

/** Read existing token from the persistent partition without showing UI. */
export async function loadExistingToken(): Promise<string | null> {
  const ses = session.fromPartition('persist:soundcloud');
  const cookies = await ses.cookies.get({ domain: '.soundcloud.com', name: 'oauth_token' });
  const tok = cookies[0]?.value ?? null;
  if (tok) setOAuthToken(tok);
  return tok;
}

export async function logout(): Promise<void> {
  const ses = session.fromPartition('persist:soundcloud');
  const all = await ses.cookies.get({ domain: '.soundcloud.com' });
  await Promise.all(
    all.map((c) =>
      ses.cookies.remove(`https://${c.domain?.replace(/^\./, '')}${c.path ?? '/'}`, c.name).catch(() => {}),
    ),
  );
  setOAuthToken(null);
}
