import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/apiError';
import { sendOtpSms } from '../../utils/sms';

const prisma = new PrismaClient();
const otpStore: { [phone: string]: { code: string; expires: number } } = {};

export async function sendOtp(phone: string) {
  // Validate Indian phone
  const cleanPhone = phone.replace(/[\+\s\-]/g, '');
  if (!cleanPhone.startsWith('91') || cleanPhone.length !== 12) {
    throw new ApiError(400, 'Invalid Indian phone number. Use +91XXXXXXXXXX format');
  }

  // Generate OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP
  otpStore[phone] = {
    code,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  // Send SMS
  try {
    await sendOtpSms(phone, code);
    return { message: 'OTP sent to your phone' };
  } catch (error) {
    console.error('SMS send failed:', error);
    
    // Development fallback: log OTP
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 OTP for ${phone}: ${code}`);
      return { message: 'OTP sent (check console)' };
    }
    
    throw new ApiError(500, 'Failed to send OTP. Please try again.');
  }
}

export async function verifyOtp(phone: string, otp: string) {
  const otpData = otpStore[phone];
  
  if (!otpData || Date.now() > otpData.expires) {
    throw new ApiError(400, 'OTP expired or invalid');
  }
  
  if (otpData.code !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  delete otpStore[phone];

  let user = await prisma.user.findUnique({
    where: { phone: phone.replace(/[\+\s\-]/g, '') },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: `User ${phone.slice(-4)}`,
        phone: phone.replace(/[\+\s\-]/g, ''),
        passwordHash: '',
        city: 'Unknown',
      } as any,
    });
  }

  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    isProfessional: user.isProfessional,
    professionalStatus: user.professionalStatus as any,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      city: user.city,
      role: user.role,
      isProfessional: user.isProfessional,
      professionalStatus: user.professionalStatus,
      createdAt: user.createdAt,
    },
    tokens: { accessToken, refreshToken },
  };
}

