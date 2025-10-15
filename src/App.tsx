import { useEffect } from 'react';
import { useRosterStore } from './state/useRosterStore';
import RosterPage from './pages/RosterPage';

const App = () => {
  const initialize = useRosterStore((state) => state.initialize);
  const initialized = useRosterStore((state) => state.initialized);
  const { highContrast, fontScale } = useRosterStore((state) => state.settings);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div
      className={`min-h-screen ${highContrast ? 'bg-white text-black' : 'bg-slate-100 text-slate-900'}`}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {initialized && <RosterPage />}
    </div>
  );
};

export default App;
