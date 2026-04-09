/**
 * Animated track showing how far a train is from the selected station.
 * ETA 1 min  -> train dot is near the station (right).
 * ETA 30 min -> train dot is far away (left).
 */
export default function TrainProgressTrack({ eta, lineColor }) {
  const maxEta = 30;
  const clamped = Math.min(Math.max(eta, 1), maxEta);
  // 6 % when far, 94 % when arriving
  const pct = ((maxEta - clamped) / maxEta) * 88 + 6;
  const arriving = eta <= 3;

  return (
    <div className="relative h-5 mt-2.5 mb-0.5">
      {/* background rail */}
      <div className="absolute top-1/2 inset-x-0 h-px -translate-y-1/2 bg-slate-700/40 rounded-full" />

      {/* coloured fill behind the train */}
      <div
        className="absolute top-1/2 left-0 h-px -translate-y-1/2 rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, transparent, ${lineColor})`,
          opacity: 0.55,
          transition: 'width 2s ease-out',
        }}
      />

      {/* train dot (bobs or pulses when arriving) */}
      <div
        className="absolute top-1/2"
        style={{ left: `${pct}%`, transition: 'left 2s ease-out' }}
      >
        <div
          className={arriving ? 'animate-train-arrive' : 'animate-train-bob'}
          style={{ marginLeft: -6, marginTop: -6 }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: lineColor,
              boxShadow: `0 0 ${arriving ? 10 : 5}px ${lineColor}70`,
            }}
          />
        </div>
      </div>

      {/* station marker on the right */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <div
          className={`w-2.5 h-2.5 rounded-full border-[1.5px] ${arriving ? 'animate-pulse-dot' : ''}`}
          style={{
            borderColor: lineColor,
            backgroundColor: arriving ? lineColor : '#1e293b',
          }}
        />
      </div>
    </div>
  );
}
