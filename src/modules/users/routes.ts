import { Router } from 'express';
import * as userController from './controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.get('/me', authenticate, userController.getMeController);
router.patch('/me', authenticate, userController.updateProfileController);

export { router as userRouter };
