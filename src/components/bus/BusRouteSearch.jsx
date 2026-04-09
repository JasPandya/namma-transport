import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ArrowRight, Loader2, Bus, ArrowUpDown, Star } from 'lucide-react';
import { searchRoutes, getRouteDetails, getActiveVehiclesForStop } from '../../services/busService';
import ETABadge from '../common/ETABadge';

export default function BusRouteSearch({ onSelectStop, addFavorite, removeFavorite, isFavorite, defaultQuery }) {
  const [query, setQuery] = useState(defaultQuery || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeDirection, setActiveDirection] = useState('up');
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (q.trim().length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchRoutes(q);
      setResults(data);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  useEffect(() => {
    if (defaultQuery && defaultQuery !== query) {
      setQuery(defaultQuery);
    }
  }, [defaultQuery]);

  const handleExpandRoute = async (route) => {
    if (expandedRoute === route.routeParentId) {
      setExpandedRoute(null);
      setRouteData(null);
      return;
    }
    setExpandedRoute(route.routeParentId);
    setLoadingRoute(true);
    setActiveDirection('up');
    try {
      const data = await getRouteDetails(route.routeParentId);
      setRouteData(data);
    } finally {
      setLoadingRoute(false);
    }
  };

  const refreshRoute = async () => {
    if (!expandedRoute) return;
    setLoadingRoute(true);
    try {
      const data = await getRouteDetails(expandedRoute);
      setRouteData(data);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (!expandedRoute) return;
    const interval = setInterval(refreshRoute, 30000);
    return () => clearInterval(interval);
  }, [expandedRoute]);

  const currentStops = routeData?.[activeDirection]?.stops || [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by route number (e.g., 500-A, 335-E, 401)..."
          className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-slate-500 focus:border-bus-orange/50 focus:ring-1 focus:ring-bus-orange/20 transition-all"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        )}
      </div>

      {results.length === 0 && query.length > 0 && !searching && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No routes found for "{query}"
        </div>
      )}

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {results.map((route) => {
          const isExpanded = expandedRoute === route.routeParentId;

          return (
            <div key={route.routeParentId} className="animate-slide-up">
              <button
                onClick={() => handleExpandRoute(route)}
                className="w-full text-left bg-surface-card border border-surface-border rounded-xl p-4 hover:border-slate-500 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-bus-orange text-white text-xs font-bold px-2.5 py-1 rounded">
                      {route.routeNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isFavorite && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFavorite(route.routeParentId)) {
                            removeFavorite(route.routeParentId);
                          } else {
                            addFavorite(route);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        <Star className={`w-4 h-4 transition-colors ${
                          isFavorite(route.routeParentId)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-500 hover:text-slate-300'
                        }`} />
                      </span>
                    )}
                    <ArrowRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-1 bg-surface-card/50 border border-surface-border rounded-xl p-4 animate-slide-up">
                  {loadingRoute ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading live data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setActiveDirection('up')}
                          className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                            activeDirection === 'up'
                              ? 'bg-bus-orange/20 text-bus-orange border border-bus-orange/30'
                              : 'text-slate-400 border border-surface-border hover:text-slate-300'
                          }`}
                        >
                          UP ({routeData?.up?.stops?.[0]?.from || ''} → {routeData?.up?.stops?.[0]?.to || ''})
                        </button>
                        <button
                          onClick={() => setActiveDirection('down')}
                          className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                            activeDirection === 'down'
                              ? 'bg-bus-orange/20 text-bus-orange border border-bus-orange/30'
                              : 'text-slate-400 border border-surface-border hover:text-slate-300'
                          }`}
                        >
                          DOWN ({routeData?.down?.stops?.[0]?.from || ''} → {routeData?.down?.stops?.[0]?.to || ''})
                        </button>
                      </div>

                      {routeData?.[activeDirection]?.vehicles?.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                          <Bus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{routeData[activeDirection].vehicles.length} buses currently on route</span>
                        </div>
                      )}

                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {currentStops.map((stop, idx) => {
                          const activeVehicles = getActiveVehiclesForStop(stop);
                          const nextBus = activeVehicles[0];
                          return (
                            <button
                              key={stop.stationId}
                              onClick={(e) => {
                                e.stopPropagation();
                                const routeNo = results.find(r => r.routeParentId === expandedRoute)?.routeNo;
                                onSelectStop({
                                  stationId: stop.stationId,
                                  stationName: stop.stationName,
                                  routeContext: {
                                    routeNo,
                                    routeParentId: expandedRoute,
                                    direction: activeDirection,
                                    from: stop.from,
                                    to: stop.to,
                                    vehicles: getActiveVehiclesForStop(stop),
                                  },
                                });
                              }}
                              className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group"
                            >
                              <div className="flex flex-col items-center">
                                <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                                  idx === 0 || idx === currentStops.length - 1
                                    ? 'bg-bus-orange border-bus-orange'
                                    : 'border-slate-500 bg-transparent group-hover:border-bus-orange'
                                }`} />
                                {idx < currentStops.length - 1 && (
                                  <div className="w-0.5 h-4 bg-slate-700 mt-0.5" />
                                )}
                              </div>
                              <span className="flex-1 text-sm text-slate-300 text-left group-hover:text-white transition-colors truncate">
                                {stop.stationName}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {activeVehicles.length > 1 && (
                                  <span className="text-[10px] text-slate-500">{activeVehicles.length} buses</span>
                                )}
                                {nextBus && <ETABadge minutes={nextBus.eta} size="sm" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
