import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'border-green-500 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200',
  error: 'border-red-500 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200',
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
  warning: 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={cn("flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right", colors[t.type])}>
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
