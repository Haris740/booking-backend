import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
    getCategoriesController,
    canApplyAsProfessionalController,
    inviteStaffController,
    getMyStaffInvitationsController,
    acceptStaffInvitationController,
    rejectStaffInvitationController,
    getMyStaffController,
    removeStaffController,
} from './controller';

const router = Router();

// Public
router.get('/categories', getCategoriesController);

// Protected
router.get('/can-apply', authenticate, canApplyAsProfessionalController);

// Staff management (Professional only)
router.post('/staff/invite', authenticate, inviteStaffController);
router.get('/staff', authenticate, getMyStaffController);
router.delete('/staff/:staffId', authenticate, removeStaffController);

// Staff invitations (User)
router.get('/staff/invitations', authenticate, getMyStaffInvitationsController);
router.post('/staff/invitations/:invitationId/accept', authenticate, acceptStaffInvitationController);
router.post('/staff/invitations/:invitationId/reject', authenticate, rejectStaffInvitationController);

export { router as professionalRouter };
