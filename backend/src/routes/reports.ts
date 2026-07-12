import { Router } from 'express';
import { getFleetUtilization, getFuelEfficiency, getOperationalCost, getVehicleROI, getOperationalSummary, getDriverPerformance, getTrends } from '../controllers/reportController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/fleet-utilization', requirePermission('reports:read'), getFleetUtilization);
router.get('/fuel-efficiency', requirePermission('reports:read'), getFuelEfficiency);
router.get('/operational-cost', requirePermission('reports:read'), getOperationalCost);
router.get('/vehicle-roi', requirePermission('reports:read'), getVehicleROI);
router.get('/summary', requirePermission('reports:read'), getOperationalSummary);
router.get('/driver-performance', requirePermission('reports:read'), getDriverPerformance);
router.get('/trends', requirePermission('reports:read'), getTrends);

export default router;
