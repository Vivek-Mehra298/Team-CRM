import { Router } from 'express';
import { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, attachFile, deleteFile } from '../controllers/customerController';
import { authenticateJWT } from '../middleware/auth';
import { orgIsolation } from '../middleware/tenant';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateJWT);
router.use(orgIsolation);

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

// File attachments
router.post('/:id/files', upload.single('file'), attachFile);
router.delete('/:customerId/files/:fileId', deleteFile);

export default router;
