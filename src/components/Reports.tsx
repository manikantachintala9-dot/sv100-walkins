import { useState } from 'react';
import type { WalkIn } from '../types';
import { ChannelAnalytics } from './ChannelAnalytics';
import { LostSalesAnalysis } from './LostSalesAnalysis';
import { DailySummary } from './DailySummary';

interface ReportsProps {
  walkins: WalkIn[];
}

type ReportTab = 'channel' | 'lost' | 'daily';

export function Reports({ walkins }: ReportsProps) {
  const [tab, setTab] = useState<ReportTab>('channel');

  const TABS: { key: ReportTab; label: string }[] = [
    { key: 'channel', label: 'Channels' },
    { key: 'lost', label: 'Lost Sales' },
    { key: 'daily', label: 'Calendar' },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="bg-rose-900 flex sticky top-0 z-20">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all border-b-2 ${
              tab === t.key
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-rose-300 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'channel' && <ChannelAnalytics walkins={walkins} />}
      {tab === 'lost' && <LostSalesAnalysis walkins={walkins} />}
      {tab === 'daily' && <DailySummary walkins={walkins} />}
    </div>
  );
}
