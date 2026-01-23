import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRouter } from './modules/auth/routes';
import { userRouter } from './modules/users/routes';
import { professionalRouter } from './modules/professionals/routes';
import { bookingRouter } from './modules/bookings/routes';
import { adminRouter } from './modules/admin/routes';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/me', userRouter);
app.use('/professional', professionalRouter);
app.use('/bookings', bookingRouter);
app.use('/admin', adminRouter);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});
// ✅ ONLY EXPORT - NO LISTEN
export { app };
