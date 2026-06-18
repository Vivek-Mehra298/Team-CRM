import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';
import { orgIsolation } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(orgIsolation);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.post('/read-all', markAllRead);

export default router;
