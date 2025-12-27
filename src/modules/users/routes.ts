import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { getMeController, updateMeController } from './controller';

const router = Router();

router.get('/', authenticate, getMeController);
router.patch('/', authenticate, updateMeController);

export { router as userRouter };
