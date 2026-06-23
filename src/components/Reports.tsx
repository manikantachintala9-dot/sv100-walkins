import { useState } from 'react';
import type { WalkIn } from '../types';
import { ChannelAnalytics } from './ChannelAnalytics';
import { LostSalesAnalysis } from './LostSalesAnalysis';
import { DailySummary } from './DailySummary';
import { SalesFunnel } from './SalesFunnel';

interface ReportsProps {
  walkins: WalkIn[];
}

type ReportTab = 'funnel' | 'channel' | 'lost' | 'daily';

export function Reports({ walkins }: ReportsProps) {
  const [tab, setTab] = useState<ReportTab>('funnel');

  const TABS: { key: ReportTab; label: string }[] = [
    { key: 'funnel', label: '🎯 Funnel' },
    { key: 'channel', label: 'Channels' },
    { key: 'lost', label: 'Lost Sales' },
    { key: 'daily', label: 'Calendar' },
  ];

  return (
    <div>
      <div className="bg-rose-900 flex sticky top-0 z-20 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 whitespace-nowrap px-2 ${
              tab === t.key
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-rose-300 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'funnel' && <SalesFunnel walkins={walkins} />}
      {tab === 'channel' && <ChannelAnalytics walkins={walkins} />}
      {tab === 'lost' && <LostSalesAnalysis walkins={walkins} />}
      {tab === 'daily' && <DailySummary walkins={walkins} />}
    </div>
  );
}
