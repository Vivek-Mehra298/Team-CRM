import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { orgIsolation } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(orgIsolation);

router.get('/', requireRoles(['leader', 'manager']), getAnalyticsSummary);

export default router;
