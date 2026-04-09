import { useState, useEffect } from 'react';
import { MapPin, Bus, RefreshCw, ArrowLeft, Loader2, Clock, Navigation } from 'lucide-react';
import { searchStops, getRouteDetails, getActiveVehiclesForStop } from '../../services/busService';
import * as bmtcApi from '../../services/bmtcApi';
import ETABadge from '../common/ETABadge';

export default function BusStopView({ stop, onBack }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const stationName = typeof stop === 'string' ? stop : stop?.stationName || '';

  const fetchRoutes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const stopResults = await bmtcApi.searchStops(stationName);
      if (stopResults.length === 0) {
        setRoutes([]);
        return;
      }

      const searchResults = await bmtcApi.searchRoutes(stationName.split(' ')[0]);
      
      const routePromises = searchResults.slice(0, 8).map(async (r) => {
        try {
          const details = await bmtcApi.getRouteDetails(r.routeParentId);
          const allStops = [...(details.up?.stops || []), ...(details.down?.stops || [])];
          const matchingStop = allStops.find(
            (s) => s.stationName.toLowerCase().includes(stationName.toLowerCase()) ||
                   stationName.toLowerCase().includes(s.stationName.toLowerCase())
          );
          if (matchingStop) {
            const vehicles = getActiveVehiclesForStop(matchingStop);
            return {
              routeNo: r.routeNo,
              routeParentId: r.routeParentId,
              from: matchingStop.from,
              to: matchingStop.to,
              vehicles,
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const resolvedRoutes = (await Promise.all(routePromises)).filter(Boolean);
      setRoutes(resolvedRoutes);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch bus data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    const interval = setInterval(() => fetchRoutes(true), 30000);
    return () => clearInterval(interval);
  }, [stationName]);

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
            <h2 className="text-lg font-semibold text-white">{stationName}</h2>
          </div>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchRoutes(true)}
          disabled={refreshing}
          className="p-2 rounded-lg bg-surface-card border border-surface-border hover:border-slate-500 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading live bus data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Bus className="w-10 h-10 text-red-400/50 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => fetchRoutes()}
            className="mt-3 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12">
          <Bus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No buses currently running at this stop</p>
          <p className="text-slate-600 text-xs mt-1">Check back during service hours</p>
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              key={route.routeParentId}
              className="bg-surface-card border border-surface-border rounded-xl p-3.5 hover:border-slate-500 transition-all animate-slide-up"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-bus-orange text-white text-xs font-bold px-2 py-0.5 rounded">
                      {route.routeNo}
                    </span>
                    {route.from && route.to && (
                      <span className="text-xs text-slate-500 truncate">{route.from} → {route.to}</span>
                    )}
                  </div>

                  {route.vehicles.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {route.vehicles.slice(0, 3).map((v) => (
                        <div key={v.vehicleId} className="flex items-center gap-2 text-xs">
                          <Bus className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="text-slate-400">{v.vehicleNumber}</span>
                          {v.serviceType && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              v.serviceType.includes('AC') && !v.serviceType.includes('Non')
                                ? 'bg-blue-600/20 text-blue-400'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {v.serviceType}
                            </span>
                          )}
                          {v.scheduledArrival && (
                            <span className="text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {v.scheduledArrival}
                            </span>
                          )}
                          <div className="ml-auto">
                            <ETABadge minutes={v.eta} size="sm" />
                          </div>
                        </div>
                      ))}
                      {route.vehicles.length > 3 && (
                        <p className="text-[10px] text-slate-500 pl-5">+{route.vehicles.length - 3} more buses</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">No live buses currently</p>
                  )}
                </div>

                {route.vehicles.length > 0 && (
                  <div className="flex-shrink-0">
                    <ETABadge minutes={route.vehicles[0].eta} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
