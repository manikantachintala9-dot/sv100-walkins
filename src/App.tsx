import { useState, useEffect } from 'react';
import type { WalkIn, View } from './types';
import { initializeDemoData, saveWalkins } from './demoData';
import { Layout } from './components/Layout';

export default function App() {
  const [walkins, setWalkins] = useState<WalkIn[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = initializeDemoData();
    setWalkins(data);
    setLoaded(true);
  }, []);

  function addWalkin(w: WalkIn) {
    setWalkins(prev => {
      const next = [w, ...prev];
      saveWalkins(next);
      return next;
    });
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-800 rounded-full animate-spin mx-auto" />
          <div className="text-rose-800 font-semibold mt-3 text-sm">Loading SV 100...</div>
        </div>
      </div>
    );
  }

  return (
    <Layout
      walkins={walkins}
      currentView={currentView}
      setView={setCurrentView}
      onAdd={addWalkin}
    />
  );
}
