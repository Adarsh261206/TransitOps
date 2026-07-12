import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  meta?: Record<string, any>;
}

export function SearchableSelect({
  options, value, onChange, placeholder, label, error, className, disabled, clearable = true, searchable = true,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = searchable
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || (o.sublabel || '').toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && <label className="text-sm font-medium mb-1 block">{label}</label>}
      <div
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
        onClick={() => { if (!disabled) { setOpen(!open); setSearch(''); } }}
      >
        <div className="flex-1 truncate">
          {selected ? (
            <span className="font-medium">{selected.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder || 'Select...'}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <button onClick={(e) => { e.stopPropagation(); onChange(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[250px] rounded-xl border bg-card shadow-lg">
          {searchable && (
            <div className="relative p-2 border-b">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full h-8 pl-7 pr-3 text-sm rounded-md border-0 bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No results</p>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                    opt.value === value ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                    opt.disabled && "opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && <div className="text-xs text-muted-foreground truncate">{opt.sublabel}</div>}
                  </div>
                  {opt.meta && Object.entries(opt.meta).map(([k, v]) => (
                    <span key={k} className="text-xs text-muted-foreground shrink-0">{v}</span>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
