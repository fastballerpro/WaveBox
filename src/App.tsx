import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Titlebar } from './components/Titlebar';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Likes } from './pages/Likes';
import { History } from './pages/History';
import { ArtistPage } from './pages/Artist';
import { PlaylistPage } from './pages/Playlist';
import { Settings } from './pages/Settings';
import { usePlayer } from './lib/store';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AmbientBackdrop } from './components/AmbientBackdrop';

export default function App() {
  const setMe = usePlayer((s) => s.setMe);

  useEffect(() => {
    // Try to silently restore an oauth_token saved in the persistent partition.
    window.wavebox.auth
      .loadExisting()
      .then(({ me }) => me && setMe(me))
      .catch(() => {});
  }, [setMe]);

  return (
    <ErrorBoundary>
      <AmbientBackdrop />
      <div className="relative z-10 h-screen w-screen flex flex-col text-text">
        <Titlebar />
        <div className="flex flex-1 min-h-0">
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
          <main className="flex-1 min-w-0 overflow-y-auto">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/likes" element={<Likes />} />
                <Route path="/history" element={<History />} />
                <Route path="/artist/:id" element={<ArtistPage />} />
                <Route path="/playlist/:id" element={<PlaylistPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
        <ErrorBoundary>
          <Player />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
