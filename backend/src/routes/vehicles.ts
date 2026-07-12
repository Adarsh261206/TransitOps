import { Router } from 'express';
import { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', authorize('FLEET_MANAGER', 'DRIVER'), createVehicle);
router.put('/:id', authorize('FLEET_MANAGER'), updateVehicle);
router.delete('/:id', authorize('FLEET_MANAGER'), deleteVehicle);

export default router;
