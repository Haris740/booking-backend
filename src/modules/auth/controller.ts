import { Request, Response, NextFunction } from 'express';
import * as authService from './service';

export async function sendOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.body;
    const result = await authService.sendOtp(phone);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refreshTokenController(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN' 
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
