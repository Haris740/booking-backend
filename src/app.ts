import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './modules/auth/routes';
import { professionalRouter } from './modules/professionals/routes';
import { adminRouter } from './modules/admin/routes';
import { bookingRouter } from './modules/bookings/routes';
import { errorHandler } from './middlewares/error';
import { userRouter } from './modules/users/routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/me', userRouter);
app.use('/professional', professionalRouter);
app.use('/admin', adminRouter);
app.use('/bookings', bookingRouter);

app.use(errorHandler);

export { app };
