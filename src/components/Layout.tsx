import type { View } from '../types';
import type { WalkIn } from '../types';
import { Dashboard } from './Dashboard';
import { AddWalkin } from './AddWalkin';
import { Registry } from './Registry';
import { Reports } from './Reports';
import { FollowUpPipeline } from './FollowUpPipeline';

interface LayoutProps {
  walkins: WalkIn[];
  currentView: View;
  setView: (v: View) => void;
  onAdd: (w: WalkIn) => void;
}

interface NavItem {
  view: View | 'reports';
  label: string;
  icon: React.ReactNode;
}

function HouseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

export function Layout({ walkins, currentView, setView, onAdd }: LayoutProps) {
  const reportsViews: View[] = ['channel-analytics', 'lost-sales', 'daily-summary'];
  const isReports = reportsViews.includes(currentView);

  const NAV_ITEMS: NavItem[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <HouseIcon /> },
    { view: 'add', label: 'Add Walk-in', icon: <PlusIcon /> },
    { view: 'registry', label: 'Registry', icon: <ListIcon /> },
    { view: 'reports', label: 'Reports', icon: <ChartIcon /> },
    { view: 'followup', label: 'Follow-up', icon: <PhoneIcon /> },
  ];

  const SIDEBAR_ITEMS = [
    { view: 'dashboard' as View, label: 'Dashboard', icon: <HouseIcon /> },
    { view: 'add' as View, label: 'Add Walk-in', icon: <PlusIcon /> },
    { view: 'registry' as View, label: 'Registry', icon: <ListIcon /> },
    { view: 'channel-analytics' as View, label: 'Channels', icon: <ChartIcon /> },
    { view: 'lost-sales' as View, label: 'Lost Sales', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { view: 'followup' as View, label: 'Follow-up', icon: <PhoneIcon /> },
    { view: 'daily-summary' as View, label: 'Calendar', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
  ];

  const urgentFollowups = walkins.filter(w =>
    w.dealStatus === 'did_not_buy' && w.followUpDate && w.followUpDate <= '2026-06-20'
  ).length;

  function renderContent() {
    if (currentView === 'dashboard') return <Dashboard walkins={walkins} />;
    if (currentView === 'add') return <AddWalkin walkins={walkins} onAdd={onAdd} />;
    if (currentView === 'registry') return <Registry walkins={walkins} />;
    if (currentView === 'followup') return <FollowUpPipeline walkins={walkins} />;
    if (reportsViews.includes(currentView)) {
      return <Reports walkins={walkins} />;
    }
    return <Dashboard walkins={walkins} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-44 bg-rose-900 fixed left-0 top-0 bottom-0 z-30">
        <div className="px-4 py-5 border-b border-rose-800">
          <div className="text-white font-bold text-sm leading-tight">SV 100</div>
          <div className="text-rose-300 text-xs mt-0.5">Walk-ins Tracker</div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left ${
                currentView === item.view
                  ? 'bg-rose-800 text-white border-r-2 border-amber-400'
                  : 'text-rose-300 hover:bg-rose-800/50 hover:text-white'
              }`}>
              <span className={currentView === item.view ? 'text-amber-400' : ''}>{item.icon}</span>
              <span>{item.label}</span>
              {item.view === 'followup' && urgentFollowups > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {urgentFollowups}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-rose-800">
          <div className="text-rose-400 text-xs">Premium Sarees</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-44 min-h-screen overflow-y-auto pb-20 lg:pb-0">
        {/* Reports gets its own sub-nav built in */}
        {isReports && !['channel-analytics', 'lost-sales', 'daily-summary'].includes(currentView)
          ? renderContent()
          : renderContent()
        }
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-rose-100 shadow-lg">
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const isActive = item.view === 'reports' ? isReports : currentView === item.view;
            const hasAdd = item.view === 'add';
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => {
                  if (item.view === 'reports') {
                    setView('channel-analytics');
                  } else {
                    setView(item.view as View);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2 transition-all relative ${
                  hasAdd
                    ? 'relative -mt-3'
                    : ''
                }`}>
                {hasAdd ? (
                  <span className="w-12 h-12 rounded-full bg-rose-800 flex items-center justify-center shadow-md text-white">
                    <PlusIcon />
                  </span>
                ) : (
                  <span className={`${isActive ? 'text-rose-800' : 'text-stone-400'}`}>
                    {item.icon}
                    {item.view === 'followup' && urgentFollowups > 0 && (
                      <span className="absolute top-1.5 right-2.5 bg-amber-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {urgentFollowups > 9 ? '9+' : urgentFollowups}
                      </span>
                    )}
                  </span>
                )}
                <span className={`text-xs mt-0.5 font-medium ${
                  isActive ? 'text-rose-800' : 'text-stone-400'
                } ${hasAdd ? 'text-rose-800' : ''}`}>
                  {item.label}
                </span>
                {isActive && !hasAdd && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
