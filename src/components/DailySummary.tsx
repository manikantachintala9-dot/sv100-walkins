import { useState } from 'react';
import type { WalkIn } from '../types';
import { TODAY, DAILY_TARGET, formatINR, TRAFFIC_SOURCE_LABELS } from '../constants';

interface DailySummaryProps {
  walkins: WalkIn[];
}

interface DayStats {
  date: string;
  count: number;
  revenue: number;
  converted: number;
}

function getDayColor(count: number): string {
  if (count === 0) return 'bg-stone-50 text-stone-300';
  if (count < 35) return 'bg-red-50 text-red-700 border border-red-100';
  if (count < 50) return 'bg-amber-50 text-amber-700 border border-amber-100';
  if (count < DAILY_TARGET) return 'bg-green-50 text-green-700 border border-green-100';
  return 'bg-rose-800 text-white';
}

export function DailySummary({ walkins }: DailySummaryProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(TODAY);

  // Build stats per day for June 2026
  const dayStatsMap: Record<string, DayStats> = {};
  walkins.forEach(w => {
    const date = w.datetime.split('T')[0];
    if (!date.startsWith('2026-06')) return;
    if (!dayStatsMap[date]) dayStatsMap[date] = { date, count: 0, revenue: 0, converted: 0 };
    dayStatsMap[date].count += 1;
    if (w.dealStatus === 'bought') {
      dayStatsMap[date].revenue += w.billAmount;
      dayStatsMap[date].converted += 1;
    }
  });

  // Calendar grid for June 2026
  const YEAR = 2026, MONTH = 6;
  const daysInMonth = 30;
  const firstDayOfWeek = new Date(`${YEAR}-${String(MONTH).padStart(2, '0')}-01T00:00:00`).getDay(); // 0=Sun
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDayOfWeek).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  // Month stats
  const allDays = Object.values(dayStatsMap);
  const bestDay = allDays.reduce((a, b) => (b.count > a.count ? b : a), { date: '', count: 0, revenue: 0, converted: 0 });
  const avgDaily = allDays.length > 0
    ? Math.round(allDays.reduce((s, d) => s + d.count, 0) / allDays.length) : 0;
  const totalRevenue = allDays.reduce((s, d) => s + d.revenue, 0);
  const daysHitTarget = allDays.filter(d => d.count >= DAILY_TARGET).length;

  // Selected day details
  const selectedStats = selectedDate ? dayStatsMap[selectedDate] : null;
  const selectedWalkins = selectedDate ? walkins.filter(w => w.datetime.startsWith(selectedDate)) : [];

  const sourceBreakdown = selectedWalkins.reduce((acc, w) => {
    acc[w.trafficSource] = (acc[w.trafficSource] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="pb-4">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Daily Executive Summary</div>
        <div className="text-sm text-rose-100 mt-0.5">June 2026</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Month stats */}
        <div className="grid grid-cols-2 gap-2 fade-in-up">
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
            <div className="text-xs text-stone-500 mb-1">Avg Daily Walk-ins</div>
            <div className="text-xl font-bold text-stone-800">{avgDaily}</div>
            <div className="text-xs text-stone-400">of {DAILY_TARGET} target</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
            <div className="text-xs text-stone-500 mb-1">Days Hit Target</div>
            <div className="text-xl font-bold text-green-600">{daysHitTarget}</div>
            <div className="text-xs text-stone-400">of {allDays.length} active days</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
            <div className="text-xs text-stone-500 mb-1">Month Revenue</div>
            <div className="text-xl font-bold text-rose-800">
              {totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : formatINR(totalRevenue)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
            <div className="text-xs text-stone-500 mb-1">Best Day</div>
            <div className="text-xl font-bold text-amber-700">{bestDay.count}</div>
            <div className="text-xs text-stone-400">{bestDay.date ? bestDay.date.slice(5) : '—'}</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-3 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">June 2026</div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs text-stone-400 font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const dateStr = `2026-06-${String(day).padStart(2, '0')}`;
                const stats = dayStatsMap[dateStr];
                const count = stats?.count ?? 0;
                const isToday = dateStr === TODAY;
                const isSelected = dateStr === selectedDate;
                const isFuture = dateStr > TODAY;
                const colorClass = getDayColor(count);

                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    disabled={isFuture}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all text-center
                      ${isFuture ? 'opacity-30 cursor-default' : 'cursor-pointer hover:scale-105'}
                      ${isSelected ? 'ring-2 ring-rose-800 ring-offset-1 scale-105' : ''}
                      ${count > 0 ? colorClass : 'bg-stone-50'}
                      ${isToday ? 'ring-2 ring-amber-500' : ''}
                    `}>
                    <span className={`text-xs font-bold leading-tight ${isToday && count === 0 ? 'text-amber-600' : ''}`}>
                      {day}
                    </span>
                    {count > 0 && (
                      <span className="text-xs leading-tight opacity-80">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-100" />
              &lt;35
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-amber-50 border border-amber-100" />
              35-49
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-green-50 border border-green-100" />
              50-99
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-rose-800" />
              100+
            </span>
          </div>
        </div>

        {/* Selected day panel */}
        {selectedDate && selectedStats && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-200 p-4 fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-stone-800">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </div>
                {selectedDate === TODAY && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Today</span>
                )}
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-stone-400 hover:text-stone-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center bg-rose-50 rounded-xl p-2">
                <div className="text-xl font-bold text-rose-800">{selectedStats.count}</div>
                <div className="text-xs text-stone-500">Walk-ins</div>
                <div className="text-xs text-stone-400">{((selectedStats.count / DAILY_TARGET) * 100).toFixed(0)}% of target</div>
              </div>
              <div className="text-center bg-green-50 rounded-xl p-2">
                <div className="text-xl font-bold text-green-600">{selectedStats.converted}</div>
                <div className="text-xs text-stone-500">Converted</div>
                <div className="text-xs text-stone-400">
                  {selectedStats.count > 0 ? ((selectedStats.converted / selectedStats.count) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="text-center bg-amber-50 rounded-xl p-2">
                <div className="text-lg font-bold text-amber-700">
                  {selectedStats.revenue >= 100000
                    ? `₹${(selectedStats.revenue / 100000).toFixed(1)}L`
                    : selectedStats.revenue >= 1000
                    ? `₹${(selectedStats.revenue / 1000).toFixed(0)}K`
                    : formatINR(selectedStats.revenue)}
                </div>
                <div className="text-xs text-stone-500">Revenue</div>
              </div>
            </div>

            {/* Source breakdown */}
            <div className="text-xs font-semibold text-stone-600 mb-2">Traffic Sources</div>
            <div className="space-y-1.5">
              {Object.entries(sourceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([src, cnt]) => (
                  <div key={src} className="flex items-center gap-2">
                    <div className="text-xs text-stone-600 w-24 flex-shrink-0 truncate">
                      {TRAFFIC_SOURCE_LABELS[src as keyof typeof TRAFFIC_SOURCE_LABELS]}
                    </div>
                    <div className="flex-1 h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-800 to-amber-500 rounded-full"
                        style={{ width: `${(cnt / selectedStats.count) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-stone-600 w-6 text-right">{cnt}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedDate && !selectedStats && (
          <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center text-stone-400 fade-in-up">
            <p className="text-sm">No walk-ins recorded for this date</p>
          </div>
        )}
      </div>
    </div>
  );
}
