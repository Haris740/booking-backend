import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
    createTokenBookingController,
    createTimeSlotBookingController,
    getTokenStatusController,
    getMyBookingsController,
    cancelBookingController,
    callNextTokenController,
    markNoShowController,
    getTodayQueueController,
} from './controller';

const router = Router();

// USER ROUTES
router.post('/token', authenticate, createTokenBookingController);
router.post('/timeslot', authenticate, createTimeSlotBookingController);
router.get('/my', authenticate, getMyBookingsController);
router.get('/:bookingId/status', authenticate, getTokenStatusController);
router.patch('/:bookingId/cancel', authenticate, cancelBookingController);

// PROFESSIONAL ROUTES
router.post('/call-next', authenticate, callNextTokenController);
router.patch('/:bookingId/no-show', authenticate, markNoShowController);
router.get('/queue/today', authenticate, getTodayQueueController);

export { router as bookingRouter };
