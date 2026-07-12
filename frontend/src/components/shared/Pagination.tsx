import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>{total} total items</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="px-2">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
