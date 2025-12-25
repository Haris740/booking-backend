import { Router } from 'express';
import { sendOtpController, verifyOtpController } from './controller';

const router = Router();

router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);

export { router as authRouter };

