import { Router } from 'express';
import { 
  listPendingController, 
  getProfessionalController, 
  approveProfessionalController, 
  rejectProfessionalController 
} from './controller';
import { authenticate, requireAdmin } from '../../middlewares/auth';

const router = Router();

// List pending professionals (Admin only)
router.get('/professionals/pending', authenticate, requireAdmin, listPendingController);

// Get professional details (Admin only)
router.get('/professionals/:id', authenticate, requireAdmin, getProfessionalController);

// Approve professional (Admin only)
router.post('/professionals/:id/approve', authenticate, requireAdmin, approveProfessionalController);

// Reject professional (Admin only)
router.post('/professionals/:id/reject', authenticate, requireAdmin, rejectProfessionalController);

export { router as adminRouter };
