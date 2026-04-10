import { ArrowRight } from 'lucide-react';

export default function MetroLineMap({ line, stations, selectedStation, onSelectStation }) {
  const lineColor = line === 'purple' ? '#9333ea' : line === 'green' ? '#16a34a' : '#eab308';
  const lineBg = line === 'purple' ? 'bg-purple-600' : line === 'green' ? 'bg-green-600' : 'bg-yellow-500';
  const lineText = line === 'purple' ? 'text-purple-400' : line === 'green' ? 'text-green-400' : 'text-yellow-400';
  const lineHoverBg = line === 'purple' ? 'hover:bg-purple-600/10' : line === 'green' ? 'hover:bg-green-600/10' : 'hover:bg-yellow-500/10';

  const selectedClass =
    line === 'purple' ? 'bg-purple-600/15 border-purple-600/30'
    : line === 'green' ? 'bg-green-600/15 border-green-600/30'
    : 'bg-yellow-500/15 border-yellow-500/30';

  const interchangeBadge = (ic) => {
    if (ic === 'purple') return 'bg-purple-600/20 text-purple-400';
    if (ic === 'green') return 'bg-green-600/20 text-green-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };
  const interchangeLabel = (ic) =>
    ic === 'purple' ? 'Purple' : ic === 'green' ? 'Green' : 'Yellow';

  return (
    <div className="space-y-1">
      {stations.map((station, idx) => {
        const isSelected = selectedStation === station.id;
        const isTerminal = idx === 0 || idx === stations.length - 1;
        const hasInterchange = !!station.interchange;

        return (
          <button
            key={station.id}
            onClick={() => onSelectStation(station.id)}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all cursor-pointer group ${
              isSelected
                ? `${selectedClass} border`
                : `border border-transparent ${lineHoverBg}`
            }`}
          >
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`rounded-full border-2 ${
                  isSelected
                    ? `w-3.5 h-3.5 ${lineBg} border-current ${lineText}`
                    : isTerminal
                    ? `w-3 h-3 ${lineBg} border-current ${lineText}`
                    : `w-2.5 h-2.5 border-slate-500 bg-transparent group-hover:border-current ${lineText}`
                }`}
                style={isSelected || isTerminal ? { borderColor: lineColor, backgroundColor: lineColor } : undefined}
              />
              {idx < stations.length - 1 && (
                <div className="w-0.5 h-3" style={{ backgroundColor: lineColor + '40' }} />
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    isSelected ? 'text-white font-medium' : 'text-slate-300 group-hover:text-white'
                  } transition-colors`}
                >
                  {station.name}
                </span>
                {hasInterchange && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${interchangeBadge(station.interchange)}`}>
                    {interchangeLabel(station.interchange)}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">{station.code}</span>
            </div>

            {isSelected && (
              <ArrowRight className={`w-4 h-4 ${lineText} flex-shrink-0`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
