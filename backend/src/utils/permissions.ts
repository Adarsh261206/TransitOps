export const Permissions = {
  FLEET_READ: 'fleet:read',
  FLEET_CREATE: 'fleet:create',
  FLEET_EDIT: 'fleet:edit',
  FLEET_DELETE: 'fleet:delete',
  FLEET_RETIRE: 'fleet:retire',
  FLEET_STATUS: 'fleet:status',
  FLEET_APPROVE_MAINTENANCE: 'fleet:approve_maintenance',

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
  MAINTENANCE_APPROVE: 'maintenance:approve',

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

type Permission = typeof Permissions[keyof typeof Permissions];

export const RolePermissions: Record<string, Permission[]> = {
  FLEET_MANAGER: [
    Permissions.FLEET_READ, Permissions.FLEET_CREATE, Permissions.FLEET_EDIT, Permissions.FLEET_DELETE, Permissions.FLEET_RETIRE, Permissions.FLEET_STATUS,
    Permissions.MAINTENANCE_READ, Permissions.MAINTENANCE_CREATE, Permissions.MAINTENANCE_CLOSE, Permissions.MAINTENANCE_APPROVE,
    Permissions.DOCUMENTS_READ, Permissions.DOCUMENTS_UPLOAD,
    Permissions.DRIVERS_READ, Permissions.DRIVERS_CREATE, Permissions.DRIVERS_EDIT,
    Permissions.FUEL_READ, Permissions.FUEL_CREATE,
    Permissions.EXPENSES_READ, Permissions.EXPENSES_CREATE,
    Permissions.TRIPS_READ,
    Permissions.REPORTS_READ, Permissions.REPORTS_EXPORT_CSV,
    Permissions.COMPLIANCE_READ,
    Permissions.ANALYTICS_READ, Permissions.ANALYTICS_EXPORT,
    Permissions.NOTIFICATIONS_READ, Permissions.AUDIT_READ,
    Permissions.SETTINGS_READ, Permissions.SETTINGS_WRITE,
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

export function hasPermission(role: string, permission: string): boolean {
  const perms = RolePermissions[role];
  if (!perms) return false;
  return perms.includes(permission as Permission);
}
