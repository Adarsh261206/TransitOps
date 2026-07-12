import { Router } from 'express';
import { getDashboardKPIs } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/kpis', getDashboardKPIs);

export default router;
