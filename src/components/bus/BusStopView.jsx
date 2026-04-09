import { useState, useEffect } from 'react';
import { MapPin, Bus, Users, RefreshCw, ArrowLeft } from 'lucide-react';
import { getBusETAsAtStop } from '../../services/busService';
import { routeTypes } from '../../data/busRoutes';
import ETABadge from '../common/ETABadge';

export default function BusStopView({ stopName, onBack }) {
  const [etas, setEtas] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchETAs = () => {
    setRefreshing(true);
    const data = getBusETAsAtStop(stopName);
    setEtas(data);
    setLastUpdated(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    fetchETAs();
    const interval = setInterval(fetchETAs, 30000);
    return () => clearInterval(interval);
  }, [stopName]);

  const occupancyLabel = (level) => {
    const labels = { low: 'Not Crowded', medium: 'Moderate', high: 'Crowded' };
    const colors = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
    return <span className={`text-xs ${colors[level]}`}>{labels[level]}</span>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-surface-card border border-surface-border hover:border-slate-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-bus-orange" />
            <h2 className="text-lg font-semibold text-white">{stopName}</h2>
          </div>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchETAs}
          className="p-2 rounded-lg bg-surface-card border border-surface-border hover:border-slate-500 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {etas.length === 0 ? (
        <div className="text-center py-12">
          <Bus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No buses currently running at this stop</p>
          <p className="text-slate-600 text-xs mt-1">Check back during service hours</p>
        </div>
      ) : (
        <div className="space-y-2">
          {etas.map((bus) => {
            const typeInfo = routeTypes[bus.routeType] || routeTypes.ordinary;
            return (
              <div
                key={bus.id}
                className="bg-surface-card border border-surface-border rounded-xl p-3.5 hover:border-slate-500 transition-all animate-slide-up"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${typeInfo.color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                        {bus.routeNumber}
                      </span>
                      <span className="text-xs text-slate-500">{bus.vehicleId}</span>
                    </div>
                    <p className="text-sm text-slate-300 truncate">{bus.routeName}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Users className="w-3 h-3 text-slate-500" />
                      {occupancyLabel(bus.occupancy)}
                    </div>
                  </div>
                  <ETABadge minutes={bus.eta} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
