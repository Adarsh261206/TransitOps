import { Router } from 'express';
import { getMaintenanceLogs, getMaintenanceLog, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '../controllers/maintenanceController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('maintenance:read'), getMaintenanceLogs);
router.get('/:id', requirePermission('maintenance:read'), getMaintenanceLog);
router.post('/', requirePermission('maintenance:create'), createMaintenanceLog);
router.patch('/:id', requirePermission('maintenance:close'), updateMaintenanceLog);
router.delete('/:id', requirePermission('maintenance:delete'), deleteMaintenanceLog);

export default router;
