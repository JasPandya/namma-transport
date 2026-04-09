import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Route, Bus, Loader2 } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import BusRouteSearch from './BusRouteSearch';
import BusStopView from './BusStopView';
import { searchStops } from '../../services/busService';

export default function BusPanel() {
  const [view, setView] = useState('search');
  const [selectedStop, setSelectedStop] = useState(null);
  const [stopQuery, setStopQuery] = useState('');
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [searchingStops, setSearchingStops] = useState(false);
  const [activeSearchMode, setActiveSearchMode] = useState('route');
  const debounceRef = useRef(null);

  const doStopSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 3) {
      setStopSuggestions([]);
      return;
    }
    setSearchingStops(true);
    try {
      const results = await searchStops(q);
      setStopSuggestions(results.map((s) => ({ ...s, label: s.stationName })));
    } finally {
      setSearchingStops(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doStopSearch(stopQuery), 400);
    return () => clearTimeout(debounceRef.current);
  }, [stopQuery, doStopSearch]);

  const handleSelectStop = (stop) => {
    const stopData = typeof stop === 'string'
      ? { stationName: stop }
      : stop;
    setSelectedStop(stopData);
    setView('stop');
  };

  const handleBack = () => {
    setSelectedStop(null);
    setView('search');
  };

  if (view === 'stop' && selectedStop) {
    return <BusStopView stop={selectedStop} onBack={handleBack} />;
  }

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
          {searchingStops && (
            <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Searching stops...</span>
            </div>
          )}
          {!stopQuery && !searchingStops && (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Search for a bus stop</p>
              <p className="text-slate-600 text-xs mt-1">Minimum 3 characters to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
