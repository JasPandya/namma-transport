import { useState, useEffect, useRef, useCallback } from 'react';
import { Train, Search } from 'lucide-react';
import { metroLines } from '../../data/metroData';
import { searchStations } from '../../services/metroService';
import SearchBar from '../common/SearchBar';
import MetroLineMap from './MetroLineMap';
import MetroStopView from './MetroStopView';

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

export default function MetroPanel() {
  const [view, setView] = useState(() => getSession('nt:metro:view', 'lines'));
  const [selectedLine, setSelectedLine] = useState(() => getSession('nt:metro:line', 'purple'));
  const [selectedStation, setSelectedStation] = useState(() => getSession('nt:metro:station', null));
  const [searchQuery, setSearchQuery] = useState('');
  const viewRef = useRef(view);

  useEffect(() => { viewRef.current = view; }, [view]);

  const handleBack = useCallback(() => {
    setSelectedStation(null);
    setView('lines');
    setSession('nt:metro:station', null);
    setSession('nt:metro:view', 'lines');
  }, []);

  const handleSelectStation = (stationId) => {
    setSelectedStation(stationId);
    setView('station');
    setSession('nt:metro:station', stationId);
    setSession('nt:metro:view', 'station');
    window.history.pushState({ ntView: 'metro-station' }, '');
  };

  const handleLineChange = (lineId) => {
    setSelectedLine(lineId);
    setSession('nt:metro:line', lineId);
  };

  // Handle phone back gesture / browser back button
  useEffect(() => {
    const onPopState = () => {
      if (viewRef.current === 'station') {
        handleBack();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBack]);

  // If app loads directly into station view (page refresh), push a history entry
  useEffect(() => {
    if (view === 'station' && selectedStation) {
      window.history.pushState({ ntView: 'metro-station' }, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view === 'station' && selectedStation) {
    return <MetroStopView stationId={selectedStation} onBack={handleBack} />;
  }

  const searchResults = searchStations(searchQuery).map((s) => ({
    ...s,
    label: `${s.name} (${s.code}) - ${s.lineName}`,
  }));

  const line = metroLines[selectedLine];

  return (
    <div className="space-y-4">
      <SearchBar
        placeholder="Search metro station (e.g., MG Road, Majestic)..."
        value={searchQuery}
        onChange={setSearchQuery}
        suggestions={searchResults}
        onSelect={(station) => handleSelectStation(station.id)}
        icon={Search}
      />

      <div className="flex gap-2">
        {Object.entries(metroLines).map(([id, l]) => {
          const activeClass =
            id === 'purple' ? 'bg-purple-600/20 text-purple-400 border-purple-600/30'
            : id === 'green' ? 'bg-green-600/20 text-green-400 border-green-600/30'
            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

          return (
            <button
              key={id}
              onClick={() => handleLineChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                selectedLine === id
                  ? activeClass
                  : 'bg-surface-card text-slate-400 border-surface-border hover:text-slate-300'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              {l.name}
              <span className="text-[10px] opacity-60">({l.stations.length})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-3 max-h-[calc(100vh-320px)] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {line.name} Stations
          </h3>
          <span className="text-xs text-slate-600">{line.stations.length} stations</span>
        </div>
        <MetroLineMap
          line={selectedLine}
          stations={line.stations}
          selectedStation={selectedStation}
          onSelectStation={handleSelectStation}
        />
      </div>
    </div>
  );
}
