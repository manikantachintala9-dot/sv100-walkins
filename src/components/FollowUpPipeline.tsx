import type { WalkIn } from '../types';
import { TODAY, REQUIREMENT_LABELS, BUDGET_LABELS, getInitials } from '../constants';

interface FollowUpPipelineProps {
  walkins: WalkIn[];
}

type Category = 'overdue' | 'today' | 'tomorrow' | 'upcoming';

function getCategory(date: string): Category {
  const tomorrow = new Date(TODAY + 'T00:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (date < TODAY) return 'overdue';
  if (date === TODAY) return 'today';
  if (date === tomorrowStr) return 'tomorrow';
  return 'upcoming';
}

const CATEGORY_CONFIG: Record<Category, {
  label: string; badge: string; cardClass: string; badgeClass: string;
}> = {
  overdue: {
    label: 'Overdue',
    badge: '⚠ OVERDUE',
    cardClass: 'bg-red-50 border-red-200',
    badgeClass: 'bg-red-600 text-white',
  },
  today: {
    label: 'Call Today',
    badge: '📞 Call Today',
    cardClass: 'bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-500 text-white',
  },
  tomorrow: {
    label: 'Tomorrow',
    badge: '🗓 Tomorrow',
    cardClass: 'bg-rose-50 border-rose-200',
    badgeClass: 'bg-rose-200 text-rose-800',
  },
  upcoming: {
    label: 'Upcoming',
    badge: '📅 Upcoming',
    cardClass: 'bg-white border-stone-100',
    badgeClass: 'bg-stone-100 text-stone-600',
  },
};

export function FollowUpPipeline({ walkins }: FollowUpPipelineProps) {
  const pipeline = walkins
    .filter(w => w.dealStatus === 'did_not_buy' && w.followUpDate)
    .sort((a, b) => (a.followUpDate ?? '').localeCompare(b.followUpDate ?? ''));

  const grouped: Record<Category, WalkIn[]> = {
    overdue: [], today: [], tomorrow: [], upcoming: [],
  };
  pipeline.forEach(w => {
    const cat = getCategory(w.followUpDate!);
    grouped[cat].push(w);
  });

  const urgentCount = grouped.overdue.length + grouped.today.length;
  const order: Category[] = ['overdue', 'today', 'tomorrow', 'upcoming'];

  return (
    <div className="pb-4">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Follow-up Pipeline</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-rose-100">{pipeline.length} pending follow-ups</span>
          {urgentCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {urgentCount} urgent
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {pipeline.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p className="text-sm font-medium">No follow-ups scheduled</p>
            <p className="text-xs mt-1">Add follow-up dates when logging walk-ins</p>
          </div>
        ) : (
          order.map(cat => {
            const entries = grouped[cat];
            if (entries.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <div key={cat} className="fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cfg.badgeClass}`}>
                    {cfg.badge}
                  </span>
                  <span className="text-xs text-stone-500">{entries.length} customer{entries.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {entries.map(w => {
                    const visitDate = w.datetime.split('T')[0];
                    const visitTime = w.datetime.split('T')[1]?.slice(0, 5) ?? '';
                    return (
                      <div key={w.id} className={`rounded-xl border p-3 shadow-sm ${cfg.cardClass}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-rose-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {getInitials(w.customerName)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-stone-800 truncate">{w.customerName}</div>
                              <a
                                href={`tel:${w.phone}`}
                                className="text-xs text-rose-800 font-semibold hover:underline flex items-center gap-0.5 mt-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {w.phone}
                              </a>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right text-xs text-stone-500">
                            <div className="font-semibold text-stone-700">{w.followUpDate}</div>
                            <div className="mt-0.5">{w.salesperson}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2.5 ml-11">
                          <span className="text-xs bg-white/60 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                            {REQUIREMENT_LABELS[w.requirement]}
                          </span>
                          <span className="text-xs bg-white/60 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                            {BUDGET_LABELS[w.budget]}
                          </span>
                          <span className="text-xs text-stone-400">
                            Visited {visitDate} {visitTime}
                          </span>
                        </div>

                        {w.notes && (
                          <div className="mt-2 ml-11 text-xs text-stone-600 bg-white/60 rounded-lg px-2.5 py-2 italic border border-white/80">
                            {w.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
