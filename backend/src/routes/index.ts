import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } from '../controllers/driverController.js';
import { getTrips, getTrip, createTrip, updateTripStatus, deleteTrip } from '../controllers/tripController.js';
import { getMaintenanceLogs, getMaintenanceLog, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '../controllers/maintenanceController.js';
import { getFuelLogs, getFuelLog, createFuelLog, updateFuelLog, deleteFuelLog } from '../controllers/fuelLogController.js';
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';
import { getFleetUtilization, getFuelEfficiency, getOperationalCost, getVehicleROI, getOperationalSummary } from '../controllers/reportController.js';
import { getFleetManagerDashboard, getDispatcherDashboard, getSafetyOfficerDashboard, getFinancialAnalystDashboard } from '../controllers/dashboardController.js';

const router = Router();

// Vehicles
router.get('/vehicles', requirePermission('fleet:read'), getVehicles);
router.post('/vehicles', requirePermission('fleet:create'), createVehicle);
router.put('/vehicles/:id', requirePermission('fleet:edit'), updateVehicle);
router.delete('/vehicles/:id', requirePermission('fleet:delete'), deleteVehicle);
router.get('/vehicles/:id', requirePermission('fleet:read'), getVehicle);

// Drivers
router.get('/drivers', requirePermission('drivers:read'), getDrivers);
router.post('/drivers', requirePermission('drivers:create'), createDriver);
router.put('/drivers/:id', requirePermission('drivers:edit'), updateDriver);
router.delete('/drivers/:id', requirePermission('drivers:delete'), deleteDriver);
router.get('/drivers/:id', requirePermission('drivers:read'), getDriver);

// Trips
router.get('/trips', requirePermission('trips:read'), getTrips);
router.post('/trips', requirePermission('trips:create'), createTrip);
router.get('/trips/:id', requirePermission('trips:read'), getTrip);

// Maintenance
router.get('/maintenance', requirePermission('maintenance:read'), getMaintenanceLogs);
router.post('/maintenance', requirePermission('maintenance:create'), createMaintenanceLog);
router.get('/maintenance/:id', requirePermission('maintenance:read'), getMaintenanceLog);
router.put('/maintenance/:id', requirePermission('maintenance:close'), updateMaintenanceLog);
router.delete('/maintenance/:id', requirePermission('maintenance:delete'), deleteMaintenanceLog);

// Fuel
router.get('/fuel', requirePermission('fuel:read'), getFuelLogs);
router.post('/fuel', requirePermission('fuel:create'), createFuelLog);

// Expenses
router.get('/expenses', requirePermission('expenses:read'), getExpenses);
router.post('/expenses', requirePermission('expenses:create'), createExpense);

// Reports
router.get('/reports/fleet-utilization', requirePermission('reports:read'), getFleetUtilization);
router.get('/reports/fuel-efficiency', requirePermission('reports:read'), getFuelEfficiency);
router.get('/reports/operational-cost', requirePermission('reports:read'), getOperationalCost);
router.get('/reports/vehicle-roi', requirePermission('reports:read'), getVehicleROI);
router.get('/reports/summary', requirePermission('reports:read'), getOperationalSummary);

// Dashboard
router.get('/dashboard/fleet-manager', requirePermission('fleet:read'), getFleetManagerDashboard);
router.get('/dashboard/dispatcher', requirePermission('trips:read'), getDispatcherDashboard);
router.get('/dashboard/safety-officer', requirePermission('drivers:read'), getSafetyOfficerDashboard);
router.get('/dashboard/financial-analyst', requirePermission('expenses:read'), getFinancialAnalystDashboard);

export default router;
