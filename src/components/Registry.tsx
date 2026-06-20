import { useState } from 'react';
import type { WalkIn } from '../types';
import {
  TRAFFIC_SOURCE_LABELS, REQUIREMENT_LABELS, BUDGET_LABELS,
  LOST_REASON_LABELS, TODAY, getInitials,
} from '../constants';

interface RegistryProps {
  walkins: WalkIn[];
}

type Filter = 'all' | 'bought' | 'did_not_buy' | 'today' | 'week';

export function Registry({ walkins }: RegistryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const weekAgo = new Date(TODAY + 'T00:00:00');
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];

  const filtered = walkins
    .filter(w => {
      const q = search.toLowerCase();
      if (q && !w.customerName.toLowerCase().includes(q) && !w.phone.includes(q)) return false;
      if (filter === 'bought' && w.dealStatus !== 'bought') return false;
      if (filter === 'did_not_buy' && w.dealStatus !== 'did_not_buy') return false;
      if (filter === 'today' && !w.datetime.startsWith(TODAY)) return false;
      if (filter === 'week' && w.datetime.split('T')[0] < weekStr) return false;
      return true;
    })
    .sort((a, b) => b.datetime.localeCompare(a.datetime));

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'bought', label: 'Bought' },
    { key: 'did_not_buy', label: 'Lost' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
  ];

  return (
    <div className="pb-4">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Walk-in Registry</div>
        <div className="text-sm text-rose-100 mt-0.5">{walkins.length} total records</div>
      </div>

      <div className="px-4 pt-3 space-y-3 sticky top-14 bg-rose-50 z-10 pb-2">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-800 text-sm focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filter === f.key
                  ? 'bg-rose-800 text-white border-rose-800'
                  : 'bg-white text-rose-800 border-rose-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-stone-500 py-1">{filtered.length} entries</div>
            {filtered.map(w => {
              const isExpanded = expanded === w.id;
              const isBought = w.dealStatus === 'bought';
              const dateStr = w.datetime.split('T')[0];
              const timeStr = w.datetime.split('T')[1]?.slice(0, 5) ?? '';

              return (
                <div key={w.id}
                  className="bg-white rounded-xl border border-rose-100 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-3"
                    onClick={() => setExpanded(isExpanded ? null : w.id)}>
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-rose-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {getInitials(w.customerName)}
                      </div>
                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-stone-800 truncate">{w.customerName}</span>
                          <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                            isBought ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isBought ? '✓ Sold' : '✗ Lost'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-stone-500">{w.phone || '—'}</span>
                          <span className="text-xs bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">
                            {TRAFFIC_SOURCE_LABELS[w.trafficSource]}
                          </span>
                          {isBought && w.billAmount > 0 && (
                            <span className="text-xs font-semibold text-green-700">
                              ₹{w.billAmount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {w.followUpDate && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">
                              ↰ {w.followUpDate}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Chevron */}
                      <svg
                        className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-rose-50 px-3 py-3 bg-rose-50/40 expand-row">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="text-stone-500">Date & Time</span>
                          <div className="font-medium text-stone-700">{dateStr} {timeStr}</div>
                        </div>
                        <div>
                          <span className="text-stone-500">Customer Type</span>
                          <div className="font-medium text-stone-700 capitalize">{w.customerType?.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <span className="text-stone-500">Requirement</span>
                          <div className="font-medium text-stone-700">{REQUIREMENT_LABELS[w.requirement]}</div>
                        </div>
                        <div>
                          <span className="text-stone-500">Budget</span>
                          <div className="font-medium text-stone-700">{BUDGET_LABELS[w.budget]}</div>
                        </div>
                        <div>
                          <span className="text-stone-500">Salesperson</span>
                          <div className="font-medium text-stone-700">{w.salesperson || '—'}</div>
                        </div>
                        {!isBought && w.lostReason && (
                          <div>
                            <span className="text-stone-500">Lost Reason</span>
                            <div className="font-medium text-red-700">{LOST_REASON_LABELS[w.lostReason]}</div>
                          </div>
                        )}
                        {w.productsShown && (
                          <div className="col-span-2">
                            <span className="text-stone-500">Products Shown</span>
                            <div className="font-medium text-stone-700">{w.productsShown}</div>
                          </div>
                        )}
                        {w.notes && (
                          <div className="col-span-2">
                            <span className="text-stone-500">Notes</span>
                            <div className="font-medium text-stone-700 italic">{w.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
