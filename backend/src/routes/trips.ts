import { Router } from 'express';
import { getTrips, getTrip, createTrip, updateTripStatus, deleteTrip } from '../controllers/tripController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('trips:read'), getTrips);
router.get('/:id', requirePermission('trips:read'), getTrip);
router.post('/', requirePermission('trips:create'), createTrip);
router.patch('/:id/status', requirePermission('trips:dispatch'), updateTripStatus);
router.delete('/:id', requirePermission('trips:cancel'), deleteTrip);

export default router;
