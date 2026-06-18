import { Router } from 'express';
import { signup, login, verifyEmail, forgotPassword, resetPassword, getMe, logout } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateJWT, getMe);
router.post('/logout', authenticateJWT, logout);

export default router;
