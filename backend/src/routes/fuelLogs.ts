import { Router } from 'express';
import { getFuelLogs, getFuelLog, createFuelLog, updateFuelLog, deleteFuelLog } from '../controllers/fuelLogController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('fuel:read'), getFuelLogs);
router.get('/:id', requirePermission('fuel:read'), getFuelLog);
router.post('/', requirePermission('fuel:create'), createFuelLog);
router.put('/:id', requirePermission('fuel:create'), updateFuelLog);
router.delete('/:id', requirePermission('fuel:create'), deleteFuelLog);

export default router;
