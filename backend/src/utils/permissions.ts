export const Permissions = {
  FLEET_READ: 'fleet:read',
  FLEET_CREATE: 'fleet:create',
  FLEET_EDIT: 'fleet:edit',
  FLEET_DELETE: 'fleet:delete',

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
} as const;

type Permission = typeof Permissions[keyof typeof Permissions];

export const RolePermissions: Record<string, Permission[]> = {
  FLEET_MANAGER: [
    Permissions.FLEET_READ, Permissions.FLEET_CREATE, Permissions.FLEET_EDIT, Permissions.FLEET_DELETE,
    Permissions.MAINTENANCE_READ, Permissions.MAINTENANCE_CREATE, Permissions.MAINTENANCE_CLOSE,
    Permissions.DOCUMENTS_READ, Permissions.DOCUMENTS_UPLOAD,
    Permissions.DRIVERS_READ,
    Permissions.TRIPS_READ,
    Permissions.FUEL_READ,
    Permissions.EXPENSES_READ,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT_CSV,
    Permissions.COMPLIANCE_READ, Permissions.MAINTENANCE_DELETE,
  ],
  DISPATCHER: [
    Permissions.DRIVERS_READ, Permissions.DRIVERS_EDIT,
    Permissions.TRIPS_READ, Permissions.TRIPS_CREATE, Permissions.TRIPS_DISPATCH, Permissions.TRIPS_COMPLETE, Permissions.TRIPS_CANCEL,
    Permissions.FLEET_READ,
  ],
  SAFETY_OFFICER: [
    Permissions.DRIVERS_READ, Permissions.DRIVERS_EDIT, Permissions.DRIVERS_SUSPEND, Permissions.DRIVERS_ACTIVATE,
    Permissions.COMPLIANCE_READ,
    Permissions.INCIDENTS_READ,
    Permissions.TRIPS_READ,
    Permissions.DOCUMENTS_READ, Permissions.DOCUMENTS_UPLOAD,
    Permissions.FLEET_READ,
  ],
  FINANCIAL_ANALYST: [
    Permissions.EXPENSES_READ, Permissions.EXPENSES_CREATE,
    Permissions.FUEL_READ, Permissions.FUEL_CREATE,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT_CSV, Permissions.REPORTS_EXPORT_PDF,
    Permissions.ANALYTICS_READ, Permissions.ANALYTICS_EXPORT,
    Permissions.FLEET_READ,
    Permissions.TRIPS_READ,
    Permissions.MAINTENANCE_READ,
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = RolePermissions[role];
  if (!perms) return false;
  return perms.includes(permission as Permission);
}
