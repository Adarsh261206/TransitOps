import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  vehicles: 'Vehicle Registry',
  drivers: 'Driver Management',
  trips: 'Trip Management',
  maintenance: 'Maintenance',
  fuel: 'Fuel Logs',
  expenses: 'Expenses',
  reports: 'Reports & Analytics',
};

export function PageHeader({ title, description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  const location = useLocation();
  const pathSegment = location.pathname.split('/')[1];
  const pageTitle = title || routeLabels[pathSegment] || 'TransitOps';

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
