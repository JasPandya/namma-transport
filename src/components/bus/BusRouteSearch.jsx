import { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowRight, Users } from 'lucide-react';
import { searchRoutes, getBusETAsForRoute } from '../../services/busService';
import { routeTypes } from '../../data/busRoutes';
import ETABadge from '../common/ETABadge';

export default function BusRouteSearch({ onSelectStop }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [routeETAs, setRouteETAs] = useState({});

  useEffect(() => {
    if (query.trim().length > 0) {
      setResults(searchRoutes(query));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (!expandedRoute) return;
    const route = results.find((r) => r.id === expandedRoute);
    if (!route) return;
    const etas = {};
    route.stops.forEach((stop) => {
      etas[stop] = getBusETAsForRoute(route.id, stop);
    });
    setRouteETAs(etas);
    const interval = setInterval(() => {
      const updated = {};
      route.stops.forEach((stop) => {
        updated[stop] = getBusETAsForRoute(route.id, stop);
      });
      setRouteETAs(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, [expandedRoute, results]);

  const occupancyIcon = (level) => {
    const colors = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
    return <Users className={`w-3.5 h-3.5 ${colors[level] || 'text-slate-400'}`} />;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by route number (e.g., 500A, 335E, 401)..."
          className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-slate-500 focus:border-bus-orange/50 focus:ring-1 focus:ring-bus-orange/20 transition-all"
        />
      </div>

      {results.length === 0 && query.length > 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No routes found for "{query}"
        </div>
      )}

      <div className="space-y-3">
        {results.map((route) => {
          const typeInfo = routeTypes[route.type] || routeTypes.ordinary;
          const isExpanded = expandedRoute === route.id;

          return (
            <div key={route.id} className="animate-slide-up">
              <button
                onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                className="w-full text-left bg-surface-card border border-surface-border rounded-xl p-4 hover:border-slate-500 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${typeInfo.color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
                        {route.number}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 truncate">{route.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Every {route.frequency} min
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {route.stops.length} stops
                      </span>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="mt-1 bg-surface-card/50 border border-surface-border rounded-xl p-4 animate-slide-up">
                  <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Service: {route.firstBus} - {route.lastBus}</span>
                  </div>
                  <div className="space-y-1">
                    {route.stops.map((stop, idx) => {
                      const stopETAs = routeETAs[stop] || [];
                      const nextBus = stopETAs[0];
                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStop(stop);
                          }}
                          className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full border-2 ${idx === 0 || idx === route.stops.length - 1 ? 'bg-bus-orange border-bus-orange' : 'border-slate-500 bg-transparent group-hover:border-bus-orange'}`} />
                            {idx < route.stops.length - 1 && (
                              <div className="w-0.5 h-4 bg-slate-700 mt-0.5" />
                            )}
                          </div>
                          <span className="flex-1 text-sm text-slate-300 text-left group-hover:text-white transition-colors">
                            {stop}
                          </span>
                          <div className="flex items-center gap-2">
                            {nextBus && occupancyIcon(nextBus.occupancy)}
                            {nextBus && <ETABadge minutes={nextBus.eta} size="sm" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
