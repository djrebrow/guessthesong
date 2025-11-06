import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useRosterStore } from './state/useRosterStore';
import { useAuthStore } from './state/useAuthStore';
import AdminPortal from './pages/AdminPortal';
import PublicRosterView from './pages/PublicRosterView';

const App = () => {
  const initialize = useRosterStore((state) => state.initialize);
  const initialized = useRosterStore((state) => state.initialized);
  const { highContrast, fontScale } = useRosterStore((state) => state.settings);
  const initAuth = useAuthStore((state) => state.initialize);
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (authStatus === 'idle') {
      void initAuth();
    }
  }, [authStatus, initAuth]);

  return (
    <div
      className={`min-h-screen ${highContrast ? 'bg-white text-black' : 'bg-slate-100 text-slate-900'}`}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {initialized ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRosterView />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-lg font-semibold">Dienstplan wird geladen …</span>
        </div>
      )}
    </div>
  );
};

export default App;
