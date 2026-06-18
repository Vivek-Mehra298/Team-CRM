import { Router } from 'express';
import { inviteMember, removeMember, changeRole, getMembers, getOrganizationDetails } from '../controllers/orgController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getOrganizationDetails);
router.get('/members', getMembers);

router.post('/invite', requireRoles(['leader', 'manager']), inviteMember);
router.patch('/members/:memberId/role', requireRoles(['leader']), changeRole);
router.delete('/members/:memberId', requireRoles(['leader']), removeMember);

export default router;
