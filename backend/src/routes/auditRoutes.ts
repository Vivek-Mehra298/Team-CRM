import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { orgIsolation } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(orgIsolation);

router.get('/', requireRoles(['leader', 'manager']), getAuditLogs);

export default router;
