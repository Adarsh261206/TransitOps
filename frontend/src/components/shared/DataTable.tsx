import { useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Columns, Search, X } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  width?: string;
  hidden?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns: rawColumns, data, onRowClick, page, totalPages, total, onPageChange, searchable, exportable,
  stickyHeader = true,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (p: number) => void;
  searchable?: boolean;
  exportable?: boolean;
  stickyHeader?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(rawColumns.map(c => c.key)));
  const tableRef = useRef<HTMLDivElement>(null);

  const columns = rawColumns.filter(c => visibleColumns.has(c.key) && !c.hidden);

  const sorted = useMemo(() => {
    let items = [...data];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item => Object.values(item).some(v => String(v || '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      items.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [data, sortKey, sortDir, search]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = sorted.map(item => columns.map(c => {
      const val = item[c.key];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      {(searchable || exportable) && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search in table..." className="pl-8 h-8 text-sm" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
          )}
          <div className="flex gap-1 ml-auto">
            <div className="relative">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowColumns(!showColumns)}>
                <Columns className="h-3 w-3 mr-1" /> Columns
              </Button>
              {showColumns && (
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border bg-card p-2 shadow-lg" onClick={e => e.stopPropagation()}>
                  {rawColumns.filter(c => !c.hidden).map(c => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer">
                      <input type="checkbox" checked={visibleColumns.has(c.key)} onChange={() => {
                        setVisibleColumns(prev => {
                          const next = new Set(prev);
                          next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                          return next;
                        });
                      }} className="rounded" />
                      {c.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {exportable && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            )}
          </div>
        </div>
      )}

      <div ref={tableRef} className="overflow-x-auto rounded-xl border max-h-[70vh]" style={{ overflowY: 'auto' }}>
        <table className="w-full text-sm">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            <tr className="border-b bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider",
                    col.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                    col.className
                  )}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : col.sortable !== false && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">No data found</td></tr>
            ) : (
              sorted.map((item, i) => (
                <tr
                  key={item.id || i}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map(col => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)} style={{ maxWidth: col.width }}>
                      {col.render ? col.render(item) : item[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page && totalPages && total !== undefined && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total items</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="h-7 text-xs">Prev</Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)} className="h-7 text-xs">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
