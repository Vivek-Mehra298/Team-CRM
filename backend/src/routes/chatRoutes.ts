import { Router } from 'express';
import { getMessages, addReaction, markAsRead } from '../controllers/chatController';
import { authenticateJWT } from '../middleware/auth';
import { orgIsolation } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(orgIsolation);

router.get('/:channelId/messages', getMessages);
router.post('/messages/:messageId/reaction', addReaction);
router.post('/:channelId/read', markAsRead);

export default router;
