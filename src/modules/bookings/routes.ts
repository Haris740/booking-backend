import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { createBookingController, getUserBookingsController } from './controller';

const router = Router();

router.post('/', authenticate, createBookingController);
router.get('/me', authenticate, getUserBookingsController);

export { router as bookingRouter };
