import { useAuth } from '@/hooks/useAuth';
import { Truck, Users, Route, Wrench, Fuel, Receipt, BarChart3 } from 'lucide-react';

const roleCards = [
  { icon: Truck, label: 'Vehicles', desc: 'Manage your fleet of vehicles', to: '/vehicles' },
  { icon: Users, label: 'Drivers', desc: 'Manage driver profiles and licenses', to: '/drivers' },
  { icon: Route, label: 'Trips', desc: 'Create and manage trips', to: '/trips' },
  { icon: Wrench, label: 'Maintenance', desc: 'Track vehicle maintenance', to: '/maintenance' },
  { icon: Fuel, label: 'Fuel Logs', desc: 'Record fuel consumption', to: '/fuel' },
  { icon: Receipt, label: 'Expenses', desc: 'Track operational expenses', to: '/expenses' },
  { icon: BarChart3, label: 'Reports', desc: 'View analytics and insights', to: '/reports' },
];

export function QuickActions() {
  const { user } = useAuth();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {roleCards.map((card) => (
        <a
          key={card.to}
          href={card.to}
          className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/50"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <card.icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">{card.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
        </a>
      ))}
    </div>
  );
}
