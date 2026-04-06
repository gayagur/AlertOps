import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';

const ALL_REGIONS = [
  'Gush Dan', 'Sharon', 'Haifa', 'Jerusalem', 'Northern Negev',
  'Upper Galilee', 'Shfela', 'Coastal Plain', 'Arava', 'Eilat',
  'Lower Galilee', 'Judea & Samaria', 'Western Negev', 'Dead Sea',
];

interface RegionSelectorProps {
  value: string | null;
  onChange: (region: string | null) => void;
  allLabel?: string;
  placeholder?: string;
}

export function RegionSelector({
  value,
  onChange,
  allLabel = 'All Regions',
  placeholder = 'Search region...',
}: RegionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search
    ? ALL_REGIONS.filter((r) => r.toLowerCase().includes(search.toLowerCase()))
    : ALL_REGIONS;

  const displayValue = value || allLabel;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm transition-all',
          'hover:border-accent/30 hover:shadow-[var(--shadow-card)]',
          open && 'border-accent/40 ring-2 ring-accent/10',
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
        <span className={value ? 'text-text-primary font-medium' : 'text-text-secondary'}>
          {displayValue}
        </span>
        {value ? (
          <X
            className="h-3.5 w-3.5 text-text-tertiary hover:text-text-primary ml-1"
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
          />
        ) : (
          <ChevronDown className={cn('h-3.5 w-3.5 text-text-tertiary transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-border bg-surface shadow-[var(--shadow-elevated)] z-50 overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-background border border-border text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/30"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
              className={cn(
                'w-full text-left px-3.5 py-2 text-sm transition-colors',
                !value ? 'bg-accent/[0.04] text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover',
              )}
            >
              {allLabel}
            </button>

            {filtered.map((region) => (
              <button
                key={region}
                onClick={() => { onChange(region); setOpen(false); setSearch(''); }}
                className={cn(
                  'w-full text-left px-3.5 py-2 text-sm transition-colors',
                  value === region ? 'bg-accent/[0.04] text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover',
                )}
              >
                {region}
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-xs text-text-tertiary text-center">No matching regions</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
