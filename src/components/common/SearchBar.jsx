import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  suggestions = [],
  onSelect,
  icon: CustomIcon,
}) {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Icon = CustomIcon || Search;

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`flex items-center gap-2 bg-surface-card border rounded-xl px-4 py-2.5 transition-all duration-200 ${
          focused ? 'border-purple-line/50 ring-1 ring-purple-line/20' : 'border-surface-border'
        }`}
      >
        <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-surface-border rounded-xl shadow-xl max-h-60 overflow-y-auto z-40 animate-slide-up">
          {suggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(item);
                setFocused(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-hover hover:text-white transition-colors first:rounded-t-xl last:rounded-b-xl cursor-pointer"
            >
              {typeof item === 'string' ? item : item.label || item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
