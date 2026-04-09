export default function ETABadge({ minutes, size = 'md' }) {
  let colorClass, label;

  if (minutes <= 2) {
    colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
    label = 'Arriving';
  } else if (minutes <= 5) {
    colorClass = 'bg-red-500/15 text-red-400 border-red-500/20';
    label = `${minutes} min`;
  } else if (minutes <= 15) {
    colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    label = `${minutes} min`;
  } else {
    colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    label = `${minutes} min`;
  }

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${colorClass} ${sizeClass}`}
    >
      {minutes <= 2 && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-dot" />
      )}
      {label}
    </span>
  );
}
