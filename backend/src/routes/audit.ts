import { Router } from 'express';
import { getAuditLogs, getEntityTimeline } from '../controllers/auditController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('audit:read'), getAuditLogs);
router.get('/timeline/:entity/:entityId', requirePermission('audit:read'), getEntityTimeline);

export default router;
