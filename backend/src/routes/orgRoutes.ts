import { Router } from 'express';
import { inviteMember, removeMember, changeRole, getMembers, getOrganizationDetails, updateOrganizationDetails, testSmtp } from '../controllers/orgController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

// Public diagnostic endpoint
router.get('/smtp-test', testSmtp);

router.use(authenticateJWT);

router.get('/', getOrganizationDetails);
router.put('/', requireRoles(['leader']), updateOrganizationDetails);
router.get('/members', getMembers);

router.post('/invite', requireRoles(['leader', 'manager']), inviteMember);
router.patch('/members/:memberId/role', requireRoles(['leader']), changeRole);
router.delete('/members/:memberId', requireRoles(['leader']), removeMember);

export default router;
