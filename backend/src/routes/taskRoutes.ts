import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/taskController';
import { authenticateJWT } from '../middleware/auth';
import { orgIsolation } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(orgIsolation);

router.post('/', createTask);
router.get('/', getTasks);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
