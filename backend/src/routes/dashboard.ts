import { Router } from 'express';
import { getFleetManagerDashboard, getDispatcherDashboard, getSafetyOfficerDashboard, getFinancialAnalystDashboard } from '../controllers/dashboardController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/fleet-manager', requirePermission('fleet:read'), getFleetManagerDashboard);
router.get('/dispatcher', requirePermission('trips:read'), getDispatcherDashboard);
router.get('/safety-officer', requirePermission('drivers:read'), getSafetyOfficerDashboard);
router.get('/financial-analyst', requirePermission('expenses:read'), getFinancialAnalystDashboard);

export default router;
