import { Outlet, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={cn("flex flex-1 flex-col transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <TopNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
