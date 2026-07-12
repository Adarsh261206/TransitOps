import { Router } from 'express';
import { getFleetUtilization, getFuelEfficiency, getOperationalCost, getVehicleROI, getOperationalSummary } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/fleet-utilization', getFleetUtilization);
router.get('/fuel-efficiency', getFuelEfficiency);
router.get('/operational-cost', getOperationalCost);
router.get('/vehicle-roi', getVehicleROI);
router.get('/summary', getOperationalSummary);

export default router;
