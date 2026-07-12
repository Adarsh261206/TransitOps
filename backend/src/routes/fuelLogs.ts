import { Router } from 'express';
import { getFuelLogs, getFuelLog, createFuelLog, updateFuelLog, deleteFuelLog } from '../controllers/fuelLogController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getFuelLogs);
router.get('/:id', getFuelLog);
router.post('/', authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'), createFuelLog);
router.put('/:id', authorize('FLEET_MANAGER', 'FINANCIAL_ANALYST'), updateFuelLog);
router.delete('/:id', authorize('FLEET_MANAGER'), deleteFuelLog);

export default router;
