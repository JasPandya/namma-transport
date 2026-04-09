import { useState } from 'react';
import { MapPin, Route } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import BusRouteSearch from './BusRouteSearch';
import BusStopView from './BusStopView';
import { getStopSuggestions } from '../../services/busService';

export default function BusPanel() {
  const [view, setView] = useState('search');
  const [selectedStop, setSelectedStop] = useState(null);
  const [stopQuery, setStopQuery] = useState('');
  const [activeSearchMode, setActiveSearchMode] = useState('route');

  const handleSelectStop = (stopName) => {
    setSelectedStop(stopName);
    setView('stop');
  };

  const handleBack = () => {
    setSelectedStop(null);
    setView('search');
  };

  if (view === 'stop' && selectedStop) {
    return <BusStopView stopName={selectedStop} onBack={handleBack} />;
  }

  const stopSuggestions = getStopSuggestions(stopQuery);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSearchMode('route')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeSearchMode === 'route'
              ? 'bg-bus-orange/20 text-bus-orange border border-bus-orange/30'
              : 'bg-surface-card text-slate-400 border border-surface-border hover:text-slate-300'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          Search by Route
        </button>
        <button
          onClick={() => setActiveSearchMode('stop')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeSearchMode === 'stop'
              ? 'bg-bus-orange/20 text-bus-orange border border-bus-orange/30'
              : 'bg-surface-card text-slate-400 border border-surface-border hover:text-slate-300'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Search by Stop
        </button>
      </div>

      {activeSearchMode === 'route' ? (
        <BusRouteSearch onSelectStop={handleSelectStop} />
      ) : (
        <div className="space-y-4">
          <SearchBar
            placeholder="Search bus stop (e.g., Majestic, Silk Board)..."
            value={stopQuery}
            onChange={setStopQuery}
            suggestions={stopSuggestions}
            onSelect={(stop) => handleSelectStop(stop)}
            icon={MapPin}
          />
          {!stopQuery && (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Search for a bus stop</p>
              <p className="text-slate-600 text-xs mt-1">View all routes and ETAs at any stop</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
