import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/shared/NotificationDropdown';
import {
  Search, Moon, Sun, LogOut, User, ChevronDown, Settings,
  Menu, PlusCircle, CalendarPlus, UserCheck, ShieldCheck,
  UserX, Fuel, Download, Zap
} from 'lucide-react';
import { getQuickActions } from '@/utils/permissions';

const iconMap: Record<string, any> = {
  PlusCircle, CalendarPlus, UserCheck, ShieldCheck, UserX, Fuel, Download,
};

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  useKeyboardShortcuts();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const roleLabel = user?.role?.replace(/_/g, ' ');
  const quickActions = getQuickActions(user?.role);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search vehicles, drivers, trips... (Ctrl+K)" className="pl-9 h-9 bg-muted/50" />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {quickActions.length > 0 && (
          <div className="relative">
            <Button
              variant="default"
              size="sm"
              className="gap-2 text-xs h-9"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick Actions</span>
            </Button>

            {showQuickActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickActions(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border bg-card p-2 shadow-lg">
                  {quickActions.map((action) => {
                    const Icon = iconMap[action.icon];
                    return (
                      <Button
                        key={action.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => { navigate(action.path); setShowQuickActions(false); }}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5 mr-2" />}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <NotificationDropdown />

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-sm"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-medium leading-none">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{roleLabel}</div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border bg-card p-2 shadow-lg">
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">{roleLabel}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { navigate('/profile'); setShowProfile(false); }}>
                  <User className="h-3 w-3 mr-2" /> Profile
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => { navigate('/settings'); setShowProfile(false); }}>
                  <Settings className="h-3 w-3 mr-2" /> Settings
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-destructive" onClick={logout}>
                  <LogOut className="h-3 w-3 mr-2" /> Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
