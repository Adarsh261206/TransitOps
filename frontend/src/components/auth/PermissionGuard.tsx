import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Permission, hasPermission } from '../../utils/permissions';
import ForbiddenPage from '../../pages/ForbiddenPage';

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

export default function PermissionGuard({ children, permission, fallback }: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (!user || !hasPermission(user.role, permission)) {
    return fallback ? <>{fallback}</> : <ForbiddenPage />;
  }
  
  return <>{children}</>;
}

export function usePermission() {
  const { user } = useAuth();
  
  const can = (permission: Permission): boolean => {
    return hasPermission(user?.role, permission);
  };
  
  return { can, role: user?.role };
}
