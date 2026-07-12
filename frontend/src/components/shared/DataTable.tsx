import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, onRowClick }: { columns: Column<T>[]; data: T[]; onRowClick?: (item: T) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map(col => (
              <th key={col.key} className={cn("px-4 py-3 text-left font-medium text-muted-foreground", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr 
              key={item.id || i} 
              className={cn(
                "border-b last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={cn("px-4 py-3", col.className)}>
                  {col.render ? col.render(item) : item[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
