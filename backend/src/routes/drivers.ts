import { Router } from 'express';
import { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } from '../controllers/driverController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('drivers:read'), getDrivers);
router.get('/:id', requirePermission('drivers:read'), getDriver);
router.post('/', requirePermission('drivers:create'), createDriver);
router.put('/:id', requirePermission('drivers:edit'), updateDriver);
router.delete('/:id', requirePermission('drivers:delete'), deleteDriver);

export default router;
