import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  getPendingProfessionalsController,
  approveProfessionalController,
  rejectProfessionalController,
  getAllUsersController,
  getAllBookingsController,
} from './controller';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/professionals/pending', getPendingProfessionalsController);
router.patch('/professionals/:id/approve', approveProfessionalController);
router.patch('/professionals/:id/reject', rejectProfessionalController);
router.get('/users', getAllUsersController);
router.get('/bookings', getAllBookingsController);

export { router as adminRouter };
