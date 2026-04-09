import { useState } from 'react';
import { Train, Search } from 'lucide-react';
import { metroLines } from '../../data/metroData';
import { searchStations } from '../../services/metroService';
import SearchBar from '../common/SearchBar';
import MetroLineMap from './MetroLineMap';
import MetroStopView from './MetroStopView';

export default function MetroPanel() {
  const [view, setView] = useState('lines');
  const [selectedLine, setSelectedLine] = useState('purple');
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectStation = (stationId) => {
    setSelectedStation(stationId);
    setView('station');
  };

  const handleBack = () => {
    setSelectedStation(null);
    setView('lines');
  };

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
        {Object.entries(metroLines).map(([id, l]) => (
          <button
            key={id}
            onClick={() => setSelectedLine(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              selectedLine === id
                ? id === 'purple'
                  ? 'bg-purple-600/20 text-purple-400 border-purple-600/30'
                  : 'bg-green-600/20 text-green-400 border-green-600/30'
                : 'bg-surface-card text-slate-400 border-surface-border hover:text-slate-300'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            {l.name}
            <span className="text-[10px] opacity-60">({l.stations.length})</span>
          </button>
        ))}
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
