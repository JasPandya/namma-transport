import { Bus, Train, Bell } from 'lucide-react';

export default function Header({ activeReminders = 0 }) {
  return (
    <header className="bg-surface-card border-b border-surface-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Bus className="w-5 h-5 text-bus-orange" />
            <Train className="w-5 h-5 text-purple-line" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Namma Transport</h1>
            <p className="text-xs text-slate-400">Bangalore Bus & Metro Tracker</p>
          </div>
        </div>
        {activeReminders > 0 && (
          <div className="flex items-center gap-1.5 bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-full text-xs font-medium">
            <Bell className="w-3.5 h-3.5" />
            <span>{activeReminders} active</span>
          </div>
        )}
      </div>
    </header>
  );
}
