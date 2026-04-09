import { useState } from 'react';
import Header from './components/common/Header';
import TabNav from './components/common/TabNav';
import BusPanel from './components/bus/BusPanel';
import MetroPanel from './components/metro/MetroPanel';
import useReminder from './hooks/useReminder';

function App() {
  const [activeTab, setActiveTab] = useState('bus');
  const { activeReminders } = useReminder();

  return (
    <div className="min-h-screen bg-surface">
      <Header activeReminders={activeReminders.length} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-5xl mx-auto px-4 py-5">
        {activeTab === 'bus' ? <BusPanel /> : <MetroPanel />}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 border-t border-surface-border">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Namma Transport Tracker</span>
          <span>Data refreshes every 30s</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
