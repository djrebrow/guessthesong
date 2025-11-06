import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useRosterStore } from './state/useRosterStore';
import AdminPortal from './pages/AdminPortal';
import PublicRosterView from './pages/PublicRosterView';

const App = () => {
  const initialize = useRosterStore((state) => state.initialize);
  const initialized = useRosterStore((state) => state.initialized);
  const { highContrast, fontScale } = useRosterStore((state) => state.settings);

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
