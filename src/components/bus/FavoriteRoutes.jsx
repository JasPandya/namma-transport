import { Star, X } from 'lucide-react';

export default function FavoriteRoutes({ favorites, onSelectRoute, onRemoveFavorite }) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Star className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Favorites
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {favorites.map((fav) => (
          <button
            key={fav.routeParentId}
            onClick={() => onSelectRoute(fav)}
            className="flex items-center gap-1.5 bg-bus-orange/15 text-bus-orange border border-bus-orange/30 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 hover:bg-bus-orange/25 transition-colors cursor-pointer group"
          >
            <span>{fav.routeNo}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFavorite(fav.routeParentId);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onRemoveFavorite(fav.routeParentId);
                }
              }}
              className="ml-0.5 p-0.5 rounded hover:bg-bus-orange/30 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
