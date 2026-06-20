import type { WalkIn, TrafficSource } from '../types';
import { TRAFFIC_SOURCE_LABELS, SOURCE_COLORS, formatINR } from '../constants';
import { BarChart } from './charts/BarChart';

interface ChannelAnalyticsProps {
  walkins: WalkIn[];
}

export function ChannelAnalytics({ walkins }: ChannelAnalyticsProps) {
  const sourceMap: Record<string, { total: number; bought: number; revenue: number }> = {};

  walkins.forEach(w => {
    const src = w.trafficSource;
    if (!sourceMap[src]) sourceMap[src] = { total: 0, bought: 0, revenue: 0 };
    sourceMap[src].total += 1;
    if (w.dealStatus === 'bought') {
      sourceMap[src].bought += 1;
      sourceMap[src].revenue += w.billAmount;
    }
  });

  const sourceData = Object.entries(sourceMap)
    .map(([src, d]) => ({
      label: TRAFFIC_SOURCE_LABELS[src as TrafficSource] ?? src,
      total: d.total,
      bought: d.bought,
      revenue: d.revenue,
      convRate: d.total > 0 ? (d.bought / d.total) * 100 : 0,
      color: SOURCE_COLORS[src as TrafficSource] ?? '#9f1239',
    }))
    .sort((a, b) => b.total - a.total);

  const walkinsData = sourceData.map(d => ({ label: d.label, value: d.total, color: d.color }));
  const convData = sourceData.map(d => ({ label: d.label, value: parseFloat(d.convRate.toFixed(1)), color: d.color }));
  const revenueData = sourceData
    .filter(d => d.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map(d => ({ label: d.label, value: Math.round(d.revenue / 1000), color: d.color }));

  const totalWalkins = walkins.length;
  const totalRevenue = walkins.filter(w => w.dealStatus === 'bought').reduce((s, w) => s + w.billAmount, 0);
  const totalConverted = walkins.filter(w => w.dealStatus === 'bought').length;
  const overallRate = totalWalkins > 0 ? ((totalConverted / totalWalkins) * 100).toFixed(1) : '0';

  return (
    <div className="pb-4">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Channel Attribution</div>
        <div className="text-sm text-rose-100 mt-0.5">All 14 days of data</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 fade-in-up">
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-xl font-bold text-rose-800">{totalWalkins}</div>
            <div className="text-xs text-stone-500 mt-0.5">Total Walk-ins</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-xl font-bold text-green-600">{overallRate}%</div>
            <div className="text-xs text-stone-500 mt-0.5">Conversion</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-lg font-bold text-amber-700">
              {totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : formatINR(totalRevenue)}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Revenue</div>
          </div>
        </div>

        {/* Walk-ins by source */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Walk-ins by Source</div>
          <BarChart data={walkinsData} />
        </div>

        {/* Conversion rate by source */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Conversion Rate by Source</div>
          <BarChart data={convData} unit="%" maxValue={100} />
          <div className="mt-2 text-xs text-stone-400 text-center">% of walk-ins from each source that resulted in a sale</div>
        </div>

        {/* Revenue by source */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Revenue by Source (₹ thousands)</div>
          <BarChart data={revenueData} unit="" />
        </div>

        {/* Source detail table */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Source Performance Summary</div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[300px]">
              <thead>
                <tr className="border-b border-rose-100">
                  <th className="text-left py-2 text-stone-500 font-semibold">Source</th>
                  <th className="text-right py-2 text-stone-500 font-semibold">Walk-ins</th>
                  <th className="text-right py-2 text-stone-500 font-semibold">Conv%</th>
                  <th className="text-right py-2 text-stone-500 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sourceData.map((d, i) => (
                  <tr key={i} className="border-b border-rose-50 hover:bg-rose-50/50">
                    <td className="py-2 text-stone-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: d.color }} />
                        {d.label}
                      </div>
                    </td>
                    <td className="py-2 text-right text-stone-700">{d.total}</td>
                    <td className="py-2 text-right">
                      <span className={`font-semibold ${d.convRate >= 40 ? 'text-green-700' : d.convRate >= 25 ? 'text-amber-700' : 'text-red-600'}`}>
                        {d.convRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-right text-stone-700">
                      {d.revenue >= 100000 ? `₹${(d.revenue / 100000).toFixed(1)}L` : `₹${(d.revenue / 1000).toFixed(0)}K`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
