import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ 
  open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, loading 
}: { 
  open: boolean; title: string; message: string; 
  confirmLabel?: string; cancelLabel?: string; 
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>{cancelLabel || 'Cancel'}</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>{loading ? 'Please wait...' : confirmLabel || 'Confirm'}</Button>
        </div>
      </div>
    </div>
  );
}
