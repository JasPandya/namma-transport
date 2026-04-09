import { useState, useEffect } from 'react';
import { ArrowLeft, Train, RefreshCw, Bell, BellOff, Clock, CheckCircle } from 'lucide-react';
import { getStation, getTrainETAs } from '../../services/metroService';
import ETABadge from '../common/ETABadge';
import TrainProgressTrack from './TrainProgressTrack';
import useReminder from '../../hooks/useReminder';

export default function MetroStopView({ stationId, onBack }) {
  const [station, setStation] = useState(null);
  const [trainData, setTrainData] = useState({ towards_end: [], towards_start: [] });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { activeReminders, addReminder, removeReminder } = useReminder();

  const fetchData = () => {
    setRefreshing(true);
    const s = getStation(stationId);
    setStation(s);
    if (s) {
      const data = getTrainETAs(stationId);
      setTrainData(data);
    }
    setLastUpdated(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [stationId]);

  const handleSetReminder = async (train) => {
    if (!station) return;
    const existing = activeReminders.find((r) => r.trainId === train.id);
    if (existing) {
      removeReminder(existing.id);
    } else {
      if (train.eta > 10) {
        await addReminder(train, station.name);
      }
    }
  };

  if (!station) {
    return (
      <div className="text-center py-12">
        <Train className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Station not found</p>
      </div>
    );
  }

  const lineColor = station.line === 'purple' ? 'text-purple-400' : 'text-green-400';
  const lineHex = station.line === 'purple' ? '#9333ea' : '#16a34a';
  const lineBg = station.line === 'purple' ? 'bg-purple-600' : 'bg-green-600';
  const lineBorder = station.line === 'purple' ? 'border-purple-600/30' : 'border-green-600/30';
  const lineBgLight = station.line === 'purple' ? 'bg-purple-600/10' : 'bg-green-600/10';

  const renderTrainList = (trains, dirLabel) => {
    if (trains.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 text-sm">
          No trains scheduled in this direction
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {trains.map((train) => {
          const hasReminder = activeReminders.some((r) => r.trainId === train.id);
          const canSetReminder = train.eta > 10;

          return (
            <div
              key={train.id}
              className={`bg-surface-card border border-surface-border rounded-xl p-3.5 hover:border-slate-500 transition-all animate-slide-up`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Train className={`w-3.5 h-3.5 ${lineColor}`} />
                    <span className="text-sm text-white font-medium">To {train.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {train.scheduledTime}
                    </span>
                    <span>Platform {train.platform}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetReminder(train)}
                    disabled={!canSetReminder && !hasReminder}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      hasReminder
                        ? 'bg-purple-600/20 text-purple-400'
                        : canSetReminder
                        ? 'text-slate-500 hover:text-purple-400 hover:bg-purple-600/10'
                        : 'text-slate-700 cursor-not-allowed'
                    }`}
                    title={
                      hasReminder
                        ? 'Remove reminder'
                        : canSetReminder
                        ? 'Set reminder (10 min before)'
                        : 'Train arrives in less than 10 min'
                    }
                  >
                    {hasReminder ? (
                      <BellOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </button>
                  <ETABadge minutes={train.eta} />
                </div>
              </div>
              <TrainProgressTrack eta={train.eta} lineColor={lineHex} />
              {hasReminder && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
                  <CheckCircle className="w-3 h-3" />
                  Reminder set - will notify 10 min before arrival
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
            <div className={`w-2 h-2 rounded-full ${lineBg}`} />
            <h2 className="text-lg font-semibold text-white">{station.name}</h2>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${lineColor}`}>{station.lineName}</span>
            <span className="text-xs text-slate-600">|</span>
            <span className="text-xs text-slate-500">{station.code}</span>
            {lastUpdated && (
              <>
                <span className="text-xs text-slate-600">|</span>
                <span className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-surface-card border border-surface-border hover:border-slate-500 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {station.interchange && (
        <div className={`${lineBgLight} border ${lineBorder} rounded-xl p-3 text-xs`}>
          <span className="text-slate-300">Interchange station - connect to </span>
          <span className={station.interchange === 'purple' ? 'text-purple-400 font-medium' : 'text-green-400 font-medium'}>
            {station.interchange === 'purple' ? 'Purple Line' : 'Green Line'}
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
            Platform 1 - Towards End Station
          </h3>
          {renderTrainList(trainData.towards_end || [], 'towards_end')}
        </div>
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 px-1">
            Platform 2 - Towards Start Station
          </h3>
          {renderTrainList(trainData.towards_start || [], 'towards_start')}
        </div>
      </div>
    </div>
  );
}
