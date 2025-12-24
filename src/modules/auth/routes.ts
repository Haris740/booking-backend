import { Router } from 'express';
import { sendOtpController, verifyOtpController, registerController } from './controller';

const router = Router();

router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/register', registerController);

export { router as authRouter };
