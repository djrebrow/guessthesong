import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useRosterStore } from './state/useRosterStore';
import AdminPortal from './pages/AdminPortal';
import PublicRosterView from './pages/PublicRosterView';
import { useRosterStore } from './state/useRosterStore';
import RosterPage from './pages/RosterPage';

const App = () => {
  const initialize = useRosterStore((state) => state.initialize);
  const initialized = useRosterStore((state) => state.initialized);
  const { highContrast, fontScale } = useRosterStore((state) => state.settings);
  const [hydrated, setHydrated] = useState(
    typeof useRosterStore.persist?.hasHydrated === 'function'
      ? useRosterStore.persist.hasHydrated()
      : true,
  );

  useEffect(() => {
    const finishHydration = useRosterStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
      initialize();
    });

    const startHydration = useRosterStore.persist?.onHydrate?.(() => {
      setHydrated(false);
    });

    if (useRosterStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    }

    initialize();

    return () => {
      finishHydration?.();
      startHydration?.();
    };
  }, [initialize]);

  useEffect(() => {
    if (initialized) {
      setHydrated(true);
    }
  }, [initialized]);

  return (
    <div
      className={`min-h-screen ${highContrast ? 'bg-white text-black' : 'bg-slate-100 text-slate-900'}`}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {hydrated && initialized ? (
        <RosterPage />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-lg font-semibold">Dienstplan wird geladen …</span>
        </div>
      )}
    </div>
  );
};

export default App;
