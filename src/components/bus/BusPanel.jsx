import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Route, Bus, Loader2 } from 'lucide-react';
import SearchBar from '../common/SearchBar';
import BusRouteSearch from './BusRouteSearch';
import BusStopView from './BusStopView';
import FavoriteRoutes from './FavoriteRoutes';
import { searchStops } from '../../services/busService';
import useFavorites from '../../hooks/useFavorites';

function getSession(key, fallback) {
  try {
    const val = sessionStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export default function BusPanel() {
  const [view, setView] = useState(() => getSession('nt:bus:view', 'search'));
  const [selectedStop, setSelectedStop] = useState(() => getSession('nt:bus:selectedStop', null));
  const [stopQuery, setStopQuery] = useState('');
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [searchingStops, setSearchingStops] = useState(false);
  const [activeSearchMode, setActiveSearchMode] = useState(() => getSession('nt:bus:searchMode', 'route'));
  const [favoriteQuery, setFavoriteQuery] = useState('');
  const [autoExpand, setAutoExpand] = useState(null);
  const debounceRef = useRef(null);
  const viewRef = useRef(view);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => { viewRef.current = view; }, [view]);

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

  const handleBack = useCallback(() => {
    setSelectedStop(null);
    setView('search');
    setSession('nt:bus:selectedStop', null);
    setSession('nt:bus:view', 'search');
  }, []);

  const handleSelectStop = (stop) => {
    const stopData = typeof stop === 'string'
      ? { stationName: stop }
      : stop;
    setSelectedStop(stopData);
    setView('stop');
    setSession('nt:bus:selectedStop', stopData);
    setSession('nt:bus:view', 'stop');
    window.history.pushState({ ntView: 'bus-stop' }, '');
  };

  const handleSearchModeChange = (mode) => {
    setActiveSearchMode(mode);
    setSession('nt:bus:searchMode', mode);
  };

  // Handle phone back gesture / browser back button
  useEffect(() => {
    const onPopState = () => {
      if (viewRef.current === 'stop') {
        handleBack();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBack]);

  // If app loads directly into stop view (page refresh), push a history entry
  // so the phone back gesture works
  useEffect(() => {
    if (view === 'stop' && selectedStop) {
      window.history.pushState({ ntView: 'bus-stop' }, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isStopView = view === 'stop' && selectedStop;

  return (
    <div>
      {/* Keep search UI mounted so route/stop list state is preserved on back */}
      <div className="space-y-4" style={{ display: isStopView ? 'none' : undefined }}>
        <FavoriteRoutes
          favorites={favorites}
          onSelectRoute={(fav) => {
            handleSearchModeChange('route');
            setFavoriteQuery(fav.routeNo);
            setAutoExpand({ id: fav.routeParentId, ts: Date.now() });
          }}
          onRemoveFavorite={removeFavorite}
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleSearchModeChange('route')}
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
            onClick={() => handleSearchModeChange('stop')}
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
          <BusRouteSearch
            onSelectStop={handleSelectStop}
            addFavorite={addFavorite}
            removeFavorite={removeFavorite}
            isFavorite={isFavorite}
            defaultQuery={favoriteQuery}
            autoExpand={autoExpand}
          />
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

      {isStopView && (
        <BusStopView stop={selectedStop} onBack={handleBack} />
      )}
    </div>
  );
}
