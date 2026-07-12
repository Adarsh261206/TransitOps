import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, Receipt, 
  BarChart3, ChevronLeft, Moon, Sun, LogOut, Menu 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Truck, label: 'Vehicles' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/trips', icon: Route, label: 'Trips' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/fuel', icon: Fuel, label: 'Fuel Logs' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              TO
            </div>
            <span className="text-lg font-bold tracking-tight">TransitOps</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className={cn("ml-auto", collapsed && "mx-auto")}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{user.name}</div>
            <div>{user.role.replace('_', ' ')}</div>
          </div>
        )}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className={collapsed ? "mx-auto" : ""}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} className={collapsed ? "mx-auto" : ""}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
