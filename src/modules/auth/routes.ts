import { Router } from 'express';
import { refreshTokenController, sendOtpController, verifyOtpController } from './controller';

const router = Router();

router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.post('/refresh', refreshTokenController); 

export { router as authRouter };

