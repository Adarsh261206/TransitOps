import { useState } from 'react';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  info: Info, warning: AlertTriangle, success: CheckCircle, error: AlertCircle,
};

const colorMap = {
  info: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30',
  warning: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30',
  success: 'border-green-500 bg-green-50/50 dark:bg-green-950/30',
  error: 'border-red-500 bg-red-50/50 dark:bg-red-950/30',
};

export function NotificationDropdown() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="text-muted-foreground relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-80 sm:w-96 rounded-xl border bg-card shadow-lg">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-semibold">Notifications</span>
              <div className="flex gap-1">
                <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted flex items-center gap-1">
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map(n => (
                  <NotificationItem key={n.id} notification={n} onRead={() => markRead(n.id)} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, onRead }: { notification: AppNotification; onRead: () => void }) {
  const Icon = iconMap[n.type];
  return (
    <div className={cn("flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50", !n.read && "bg-muted/30")} onClick={() => { if (!n.read) onRead(); }}>
      <div className={cn("rounded-full p-1.5 shrink-0 mt-0.5", n.type === 'info' && 'bg-blue-100 text-blue-600', n.type === 'warning' && 'bg-amber-100 text-amber-600', n.type === 'success' && 'bg-green-100 text-green-600', n.type === 'error' && 'bg-red-100 text-red-600')}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{n.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{n.createdAt.toLocaleTimeString()}</p>
      </div>
      {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
    </div>
  );
}
