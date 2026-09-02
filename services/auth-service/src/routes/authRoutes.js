import { Router } from 'express';
import { verifyToken } from 'hms-shared';
import * as authController from '../controllers/authController.js';

const router = Router();

// public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// protected routes - need token
router.use(verifyToken);
router.get('/profile', authController.getProfile);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);

export default router;
