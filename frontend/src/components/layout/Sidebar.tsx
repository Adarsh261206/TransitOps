import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel,
  BarChart3, Settings, ChevronLeft, Receipt, TrendingUp, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSidebarItems } from '@/utils/permissions';
import { useAuth } from '@/hooks/useAuth';

const iconMap: Record<string, any> = {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel,
  BarChart3, Settings, Receipt, TrendingUp, Shield,
};

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user } = useAuth();
  const navItems = getSidebarItems(user?.role);

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              TO
            </div>
            <span className="text-base font-bold tracking-tight">TransitOps</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn("h-7 w-7", collapsed && "mx-auto")}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t p-2">
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">TransitOps v1.0</div>
            <div>© 2026 TransitOps</div>
          </div>
        )}
      </div>
    </aside>
  );
}
