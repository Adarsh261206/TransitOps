export const Permissions = {
  FLEET_READ: 'fleet:read',
  FLEET_CREATE: 'fleet:create',
  FLEET_EDIT: 'fleet:edit',
  FLEET_DELETE: 'fleet:delete',
  FLEET_RETIRE: 'fleet:retire',
  FLEET_STATUS: 'fleet:status',
  DRIVERS_READ: 'drivers:read',
  DRIVERS_CREATE: 'drivers:create',
  DRIVERS_EDIT: 'drivers:edit',
  DRIVERS_DELETE: 'drivers:delete',
  DRIVERS_SUSPEND: 'drivers:suspend',
  DRIVERS_ACTIVATE: 'drivers:activate',
  TRIPS_READ: 'trips:read',
  TRIPS_CREATE: 'trips:create',
  TRIPS_DISPATCH: 'trips:dispatch',
  TRIPS_COMPLETE: 'trips:complete',
  TRIPS_CANCEL: 'trips:cancel',
  TRIPS_ASSIGN: 'trips:assign',
  TRIPS_RESCHEDULE: 'trips:reschedule',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_CLOSE: 'maintenance:close',
  MAINTENANCE_DELETE: 'maintenance:delete',
  FUEL_READ: 'fuel:read',
  FUEL_CREATE: 'fuel:create',
  EXPENSES_READ: 'expenses:read',
  EXPENSES_CREATE: 'expenses:create',
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT_CSV: 'reports:export:csv',
  REPORTS_EXPORT_PDF: 'reports:export:pdf',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_UPLOAD: 'documents:upload',
  COMPLIANCE_READ: 'compliance:read',
  INCIDENTS_READ: 'incidents:read',
  INCIDENTS_CREATE: 'incidents:create',
  NOTIFICATIONS_READ: 'notifications:read',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

const RolePermissionMap: Record<string, Permission[]> = {
  FLEET_MANAGER: [
    Permissions.FLEET_READ, Permissions.FLEET_CREATE, Permissions.FLEET_EDIT, Permissions.FLEET_DELETE, Permissions.FLEET_RETIRE, Permissions.FLEET_STATUS,
    Permissions.MAINTENANCE_READ, Permissions.MAINTENANCE_CREATE, Permissions.MAINTENANCE_CLOSE,
    Permissions.DOCUMENTS_READ, Permissions.DOCUMENTS_UPLOAD,
    Permissions.DRIVERS_READ, Permissions.DRIVERS_CREATE, Permissions.DRIVERS_EDIT,
    Permissions.FUEL_READ, Permissions.FUEL_CREATE,
    Permissions.EXPENSES_READ, Permissions.EXPENSES_CREATE,
    Permissions.TRIPS_READ,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT_CSV,
    Permissions.COMPLIANCE_READ,
    Permissions.ANALYTICS_READ, Permissions.ANALYTICS_EXPORT,
    Permissions.NOTIFICATIONS_READ, Permissions.AUDIT_READ,
    Permissions.SETTINGS_READ,
  ],
  DISPATCHER: [
    Permissions.DRIVERS_READ,
    Permissions.TRIPS_READ, Permissions.TRIPS_CREATE, Permissions.TRIPS_DISPATCH, Permissions.TRIPS_COMPLETE, Permissions.TRIPS_CANCEL, Permissions.TRIPS_ASSIGN, Permissions.TRIPS_RESCHEDULE,
    Permissions.FLEET_READ,
    Permissions.SETTINGS_READ,
    Permissions.NOTIFICATIONS_READ,
  ],
  DRIVER: [
    Permissions.TRIPS_READ, Permissions.TRIPS_CREATE, Permissions.TRIPS_DISPATCH, Permissions.TRIPS_COMPLETE, Permissions.TRIPS_CANCEL, Permissions.TRIPS_ASSIGN, Permissions.TRIPS_RESCHEDULE,
    Permissions.DRIVERS_READ,
    Permissions.FLEET_READ,
    Permissions.NOTIFICATIONS_READ,
  ],
  SAFETY_OFFICER: [
    Permissions.DRIVERS_READ, Permissions.DRIVERS_CREATE, Permissions.DRIVERS_EDIT, Permissions.DRIVERS_SUSPEND, Permissions.DRIVERS_ACTIVATE,
    Permissions.COMPLIANCE_READ,
    Permissions.INCIDENTS_READ, Permissions.INCIDENTS_CREATE,
    Permissions.TRIPS_READ,
    Permissions.DOCUMENTS_READ, Permissions.DOCUMENTS_UPLOAD,
    Permissions.FLEET_READ,
    Permissions.NOTIFICATIONS_READ,
  ],
  FINANCIAL_ANALYST: [
    Permissions.EXPENSES_READ, Permissions.EXPENSES_CREATE,
    Permissions.FUEL_READ, Permissions.FUEL_CREATE,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT_CSV, Permissions.REPORTS_EXPORT_PDF,
    Permissions.ANALYTICS_READ, Permissions.ANALYTICS_EXPORT,
    Permissions.FLEET_READ,
    Permissions.TRIPS_READ,
    Permissions.MAINTENANCE_READ,
    Permissions.DRIVERS_READ,
    Permissions.NOTIFICATIONS_READ,
  ],
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  return RolePermissionMap[role]?.includes(permission) ?? false;
}

export function roleHasAnyPermission(role: string | undefined, ...permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export interface SidebarItem {
  label: string;
  path: string;
  icon: string;
  permission?: Permission;
}

export const getSidebarItems = (role: string | undefined): SidebarItem[] => {
  const items: Record<string, SidebarItem[]> = {
    FLEET_MANAGER: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: Permissions.FLEET_READ },
      { label: 'Fleet', path: '/vehicles', icon: 'Truck', permission: Permissions.FLEET_READ },
      { label: 'Maintenance', path: '/maintenance', icon: 'Wrench', permission: Permissions.MAINTENANCE_READ },
      { label: 'Drivers', path: '/drivers', icon: 'Users', permission: Permissions.DRIVERS_READ },
      { label: 'Fuel & Expenses', path: '/fuel-expenses', icon: 'Fuel', permission: Permissions.FUEL_READ },
      { label: 'Trips', path: '/trips', icon: 'Route', permission: Permissions.TRIPS_READ },
      { label: 'Reports', path: '/reports', icon: 'BarChart3', permission: Permissions.REPORTS_READ },
      { label: 'Audit Log', path: '/audit', icon: 'History', permission: Permissions.AUDIT_READ },
    ],
    DISPATCHER: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: Permissions.TRIPS_READ },
      { label: 'Trips', path: '/trips', icon: 'Route', permission: Permissions.TRIPS_READ },
      { label: 'Drivers', path: '/drivers', icon: 'Users', permission: Permissions.DRIVERS_READ },
      { label: 'Vehicles', path: '/vehicles', icon: 'Truck', permission: Permissions.FLEET_READ },
    ],
    DRIVER: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Trips', path: '/trips', icon: 'Route', permission: Permissions.TRIPS_READ },
      { label: 'Drivers', path: '/drivers', icon: 'Users', permission: Permissions.DRIVERS_READ },
      { label: 'Vehicles', path: '/vehicles', icon: 'Truck', permission: Permissions.FLEET_READ },
    ],
    SAFETY_OFFICER: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: Permissions.DRIVERS_READ },
      { label: 'Drivers', path: '/drivers', icon: 'Users', permission: Permissions.DRIVERS_READ },
      { label: 'Compliance', path: '/compliance', icon: 'Shield', permission: Permissions.COMPLIANCE_READ },
      { label: 'Incidents', path: '/incidents', icon: 'AlertTriangle', permission: Permissions.INCIDENTS_READ },
      { label: 'Trips', path: '/trips', icon: 'Route', permission: Permissions.TRIPS_READ },
      { label: 'Vehicles', path: '/vehicles', icon: 'Truck', permission: Permissions.FLEET_READ },
    ],
    FINANCIAL_ANALYST: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: Permissions.EXPENSES_READ },
      { label: 'Fuel & Expenses', path: '/fuel-expenses', icon: 'Fuel', permission: Permissions.FUEL_READ },
      { label: 'Reports & Analytics', path: '/reports', icon: 'BarChart3', permission: Permissions.REPORTS_READ },
    ],
  };
  if (!role || !items[role]) return [];
  return items[role].filter(item => !item.permission || hasPermission(role, item.permission));
};

export const getQuickActions = (role: string | undefined): { label: string; path: string; icon: string; permission: Permission }[] => {
  const actions: Record<string, any[]> = {
    FLEET_MANAGER: [
      { label: 'Add Vehicle', path: '/vehicles?action=create', icon: 'PlusCircle', permission: Permissions.FLEET_CREATE },
      { label: 'Schedule Maintenance', path: '/maintenance?action=create', icon: 'CalendarPlus', permission: Permissions.MAINTENANCE_CREATE },
    ],
    DISPATCHER: [
      { label: 'Create Trip', path: '/trips?action=create', icon: 'PlusCircle', permission: Permissions.TRIPS_CREATE },
    ],
    SAFETY_OFFICER: [
      { label: 'Verify License', path: '/drivers', icon: 'ShieldCheck', permission: Permissions.DRIVERS_READ },
      { label: 'Suspend Driver', path: '/drivers', icon: 'UserX', permission: Permissions.DRIVERS_SUSPEND },
    ],
    FINANCIAL_ANALYST: [
      { label: 'Add Expense', path: '/expenses?action=create', icon: 'PlusCircle', permission: Permissions.EXPENSES_CREATE },
      { label: 'Add Fuel', path: '/fuel?action=create', icon: 'Fuel', permission: Permissions.FUEL_CREATE },
      { label: 'Export Report', path: '/reports', icon: 'Download', permission: Permissions.REPORTS_EXPORT_CSV },
    ],
  };
  if (!role || !actions[role]) return [];
  return actions[role].filter((a: any) => hasPermission(role, a.permission));
};
