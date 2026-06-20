import { useState, useEffect } from 'react';
import type { WalkIn, View } from './types';
import { generateDemoData } from './demoData';
import { supabase, dbFetchAll, dbInsert, dbInsertBatch, dbCount, fromRow } from './lib/supabase';
import { Layout } from './components/Layout';

type LoadState = 'loading' | 'seeding' | 'ready' | 'error';

export default function App() {
  const [walkins, setWalkins] = useState<WalkIn[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Seed demo data if DB is empty
        const count = await dbCount();
        if (count === 0) {
          if (mounted) setLoadState('seeding');
          await dbInsertBatch(generateDemoData());
        }

        const data = await dbFetchAll();
        if (mounted) {
          setWalkins(data);
          setLoadState('ready');
        }
      } catch (err) {
        console.error('Supabase init error:', err);
        if (mounted) setLoadState('error');
      }
    }

    init();

    // Real-time: update all connected devices instantly on INSERT
    const channel = supabase
      .channel('walkins-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'walkins' },
        (payload) => {
          if (!mounted) return;
          const incoming = fromRow(payload.new as Parameters<typeof fromRow>[0]);
          setWalkins(prev =>
            prev.some(w => w.id === incoming.id)
              ? prev
              : [incoming, ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function addWalkin(w: WalkIn) {
    setWalkins(prev => [w, ...prev]); // optimistic
    await dbInsert(w);                 // persist to DB (triggers real-time on other devices)
  }

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-800 rounded-full animate-spin mx-auto" />
          <div className="text-rose-800 font-semibold mt-3 text-sm">Connecting to database…</div>
        </div>
      </div>
    );
  }

  if (loadState === 'seeding') {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <div className="text-rose-800 font-semibold mt-3 text-sm">Loading demo data…</div>
          <div className="text-stone-400 text-xs mt-1">First load only — takes a few seconds</div>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="text-rose-800 font-bold text-lg">Could not connect</div>
          <div className="text-stone-500 text-sm mt-1">Check your internet connection and try refreshing.</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 bg-rose-800 text-white rounded-xl text-sm font-semibold">
            Retry
          </button>
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
