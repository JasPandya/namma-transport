import { Bus, Train } from 'lucide-react';

const tabs = [
  { id: 'bus', label: 'BMTC Bus', icon: Bus, activeColor: 'text-bus-orange border-bus-orange' },
  { id: 'metro', label: 'Namma Metro', icon: Train, activeColor: 'text-purple-line border-purple-line' },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <nav className="bg-surface-card border-b border-surface-border">
      <div className="max-w-5xl mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                isActive
                  ? tab.activeColor
                  : 'text-slate-400 border-transparent hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
