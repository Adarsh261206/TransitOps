import { Router } from 'express';
import { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } from '../controllers/driverController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getDrivers);
router.get('/:id', getDriver);
router.post('/', authorize('FLEET_MANAGER'), createDriver);
router.put('/:id', authorize('FLEET_MANAGER', 'SAFETY_OFFICER'), updateDriver);
router.delete('/:id', authorize('FLEET_MANAGER'), deleteDriver);

export default router;
