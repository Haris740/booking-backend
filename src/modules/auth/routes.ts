import { Router } from 'express';
import * as authController from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.post('/send-otp', authController.sendOtpController);
router.post('/verify-otp', authController.verifyOtpController);
router.post('/refresh', authController.refreshTokenController);
router.post('/register', authenticate, authController.registerController);

export { router as authRouter };
