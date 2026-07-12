import { Router } from 'express';
import { getTrips, getTrip, createTrip, updateTripStatus, deleteTrip } from '../controllers/tripController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getTrips);
router.get('/:id', getTrip);
router.post('/', authorize('FLEET_MANAGER', 'DRIVER'), createTrip);
router.patch('/:id/status', authorize('FLEET_MANAGER', 'DRIVER'), updateTripStatus);
router.delete('/:id', authorize('FLEET_MANAGER'), deleteTrip);

export default router;
