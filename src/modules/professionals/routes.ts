import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
    applyProfessionalController,
    getCategoriesController,
    getMyProfessionalProfileController,
    listProfessionalsController
} from './controller';
import { validate } from '../../middlewares/validate';
import {
    applyProfessionalSchema,
    listProfessionalsQuerySchema
} from './validators';

const router = Router({ mergeParams: true });

// Protected: Apply to become professional
router.post(
    '/apply',
    authenticate,
    validate(applyProfessionalSchema),
    applyProfessionalController
);

// Protected: Get my professional profile
router.get('/me', authenticate, getMyProfessionalProfileController);

// Public: Search professionals
router.get('/', validate(listProfessionalsQuerySchema, 'query'), listProfessionalsController);

// Public: Get all categories
router.get('/categories', getCategoriesController);

export { router as professionalRouter };
