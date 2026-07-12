import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, updateVehicleStatus, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('fleet:read'), getVehicles);
router.get('/:id', requirePermission('fleet:read'), getVehicle);
router.post('/', requirePermission('fleet:create'), createVehicle);
router.put('/:id', requirePermission('fleet:edit'), updateVehicle);
router.patch('/:id/status', requirePermission('fleet:status'), updateVehicleStatus);
router.delete('/:id', requirePermission('fleet:delete'), deleteVehicle);

export default router;
