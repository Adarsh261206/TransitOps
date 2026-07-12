import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  vehicles: 'Fleet / Vehicle Registry',
  drivers: 'Drivers',
  trips: 'Trips',
  maintenance: 'Maintenance',
  'fuel-expenses': 'Fuel & Expenses',
  reports: 'Analytics',
  settings: 'Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, i) => {
        const label = routeLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const path = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        return (
          <span key={segment} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
