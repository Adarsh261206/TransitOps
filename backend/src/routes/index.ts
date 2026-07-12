import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { getVehicles, getVehicle, createVehicle, updateVehicle, updateVehicleStatus, deleteVehicle } from '../controllers/vehicleController.js';
import { getDrivers, getDriver, createDriver, updateDriver, updateDriverStatus, deleteDriver } from '../controllers/driverController.js';
import { getTrips, getTrip, createTrip, updateTripStatus, deleteTrip } from '../controllers/tripController.js';
import { getMaintenanceLogs, getMaintenanceLog, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '../controllers/maintenanceController.js';
import { getFuelLogs, getFuelLog, createFuelLog, updateFuelLog, deleteFuelLog } from '../controllers/fuelLogController.js';
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';
import { getFleetUtilization, getFuelEfficiency, getOperationalCost, getVehicleROI, getOperationalSummary, getDriverPerformance, getTrends } from '../controllers/reportController.js';
import { getFleetManagerDashboard, getDispatcherDashboard, getSafetyOfficerDashboard, getFinancialAnalystDashboard } from '../controllers/dashboardController.js';
import { getIncidents, getIncident, createIncident, updateIncident, deleteIncident } from '../controllers/incidentController.js';
import { getComplianceSummary } from '../controllers/complianceController.js';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../controllers/notificationController.js';
import { getAuditLogs, getEntityTimeline } from '../controllers/auditController.js';
import { getEmailLogs, getEmailLog, getEmailStats, getEmailSettings, updateEmailSettings, sendTestEmail, triggerJobs } from '../controllers/emailController.js';
import { getUsers, createUser, updateUserRole, updateUserStatus, deleteUser } from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

// Vehicles
router.get('/vehicles', requirePermission('fleet:read'), getVehicles);
router.post('/vehicles', requirePermission('fleet:create'), createVehicle);
router.put('/vehicles/:id', requirePermission('fleet:edit'), updateVehicle);
router.patch('/vehicles/:id/status', requirePermission('fleet:status'), updateVehicleStatus);
router.delete('/vehicles/:id', requirePermission('fleet:delete'), deleteVehicle);
router.get('/vehicles/:id', requirePermission('fleet:read'), getVehicle);

// Drivers
router.get('/drivers', requirePermission('drivers:read'), getDrivers);
router.post('/drivers', requirePermission('drivers:create'), createDriver);
router.put('/drivers/:id', requirePermission('drivers:edit'), updateDriver);
router.patch('/drivers/:id/status', requirePermission('drivers:edit'), updateDriverStatus);
router.delete('/drivers/:id', requirePermission('drivers:delete'), deleteDriver);
router.get('/drivers/:id', requirePermission('drivers:read'), getDriver);

// Trips
router.get('/trips', requirePermission('trips:read'), getTrips);
router.post('/trips', requirePermission('trips:create'), createTrip);
router.get('/trips/:id', requirePermission('trips:read'), getTrip);
router.patch('/trips/:id/status', requirePermission('trips:dispatch'), updateTripStatus);
router.delete('/trips/:id', requirePermission('trips:cancel'), deleteTrip);

// Maintenance
router.get('/maintenance', requirePermission('maintenance:read'), getMaintenanceLogs);
router.post('/maintenance', requirePermission('maintenance:create'), createMaintenanceLog);
router.get('/maintenance/:id', requirePermission('maintenance:read'), getMaintenanceLog);
router.patch('/maintenance/:id', requirePermission('maintenance:close'), updateMaintenanceLog);
router.delete('/maintenance/:id', requirePermission('maintenance:delete'), deleteMaintenanceLog);

// Fuel
router.get('/fuel', requirePermission('fuel:read'), getFuelLogs);
router.post('/fuel', requirePermission('fuel:create'), createFuelLog);
router.get('/fuel/:id', requirePermission('fuel:read'), getFuelLog);
router.put('/fuel/:id', requirePermission('fuel:create'), updateFuelLog);
router.delete('/fuel/:id', requirePermission('fuel:create'), deleteFuelLog);

// Expenses
router.get('/expenses', requirePermission('expenses:read'), getExpenses);
router.post('/expenses', requirePermission('expenses:create'), createExpense);
router.get('/expenses/:id', requirePermission('expenses:read'), getExpense);
router.put('/expenses/:id', requirePermission('expenses:create'), updateExpense);
router.delete('/expenses/:id', requirePermission('expenses:create'), deleteExpense);

// Reports
router.get('/reports/fleet-utilization', requirePermission('reports:read'), getFleetUtilization);
router.get('/reports/fuel-efficiency', requirePermission('reports:read'), getFuelEfficiency);
router.get('/reports/operational-cost', requirePermission('reports:read'), getOperationalCost);
router.get('/reports/vehicle-roi', requirePermission('reports:read'), getVehicleROI);
router.get('/reports/summary', requirePermission('reports:read'), getOperationalSummary);
router.get('/reports/driver-performance', requirePermission('reports:read'), getDriverPerformance);
router.get('/reports/trends', requirePermission('reports:read'), getTrends);

// Dashboard
router.get('/dashboard/fleet-manager', requirePermission('fleet:read'), getFleetManagerDashboard);
router.get('/dashboard/dispatcher', requirePermission('trips:read'), getDispatcherDashboard);
router.get('/dashboard/safety-officer', requirePermission('drivers:read'), getSafetyOfficerDashboard);
router.get('/dashboard/financial-analyst', requirePermission('expenses:read'), getFinancialAnalystDashboard);

// Notifications
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/:id/read', markAsRead);
router.post('/notifications/mark-all-read', markAllAsRead);

// Incidents
router.get('/incidents', requirePermission('incidents:read'), getIncidents);
router.post('/incidents', requirePermission('incidents:create'), createIncident);
router.get('/incidents/:id', requirePermission('incidents:read'), getIncident);
router.patch('/incidents/:id', requirePermission('incidents:create'), updateIncident);
router.delete('/incidents/:id', requirePermission('incidents:create'), deleteIncident);

// Compliance
router.get('/compliance/summary', requirePermission('compliance:read'), getComplianceSummary);

// Audit
router.get('/audit-logs', requirePermission('audit:read'), getAuditLogs);
router.get('/audit-logs/timeline/:entity/:entityId', requirePermission('audit:read'), getEntityTimeline);

// Email Center (Fleet Manager)
router.get('/email/logs', requirePermission('settings:read'), getEmailLogs);
router.get('/email/logs/stats', requirePermission('settings:read'), getEmailStats);
router.get('/email/logs/:id', requirePermission('settings:read'), getEmailLog);
router.get('/email/settings', requirePermission('settings:read'), getEmailSettings);
router.put('/email/settings', requirePermission('settings:write'), updateEmailSettings);
router.post('/email/test', requirePermission('settings:write'), sendTestEmail);
router.post('/email/trigger-jobs', requirePermission('settings:write'), triggerJobs);

// User Management (Fleet Manager only)
router.get('/users', requirePermission('settings:write'), getUsers);
router.post('/users', requirePermission('settings:write'), createUser);
router.patch('/users/:id/role', requirePermission('settings:write'), updateUserRole);
router.patch('/users/:id/status', requirePermission('settings:write'), updateUserStatus);
router.delete('/users/:id', requirePermission('settings:write'), deleteUser);

export default router;
