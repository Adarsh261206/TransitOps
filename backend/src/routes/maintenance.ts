import { Router } from 'express';
import { getMaintenanceLogs, getMaintenanceLog, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '../controllers/maintenanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getMaintenanceLogs);
router.get('/:id', getMaintenanceLog);
router.post('/', authorize('FLEET_MANAGER'), createMaintenanceLog);
router.patch('/:id', authorize('FLEET_MANAGER'), updateMaintenanceLog);
router.delete('/:id', authorize('FLEET_MANAGER'), deleteMaintenanceLog);

export default router;
