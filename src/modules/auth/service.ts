import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

// In-memory OTP store (use Redis in production)
const otpStore: { [phone: string]: { code: string; expires: number } } = {};

export async function sendOtp(phone: string) {
  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP (expires in 5 mins)
  otpStore[phone] = {
    code,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  // TODO: Send SMS via Twilio/Fast2SMS
  console.log(`OTP for ${phone}: ${code}`); // Replace with SMS service
  
  return { message: 'OTP sent to your phone' };
}

export async function verifyOtp(phone: string, otp: string) {
  const otpData = otpStore[phone];
  
  if (!otpData || Date.now() > otpData.expires) {
    throw new ApiError(400, 'OTP expired or invalid');
  }
  
  if (otpData.code !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  // Clear OTP
  delete otpStore[phone];

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { phone: phone.replace('+', '') }, // Normalize phone
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: phone, // User updates name later
        phone: phone.replace('+', ''),
        passwordHash: '', // Not used for OTP login
        city: 'Unknown',
      },
    });
  }

  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    isProfessional: user.isProfessional,
    professionalStatus: user.professionalStatus,
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

export async function register(data: { name: string; phone: string; city?: string }) {
  const existingUser = await prisma.user.findUnique({
    where: { phone: data.phone.replace('+', '') },
  });

  if (existingUser) {
    throw new ApiError(409, 'Phone already registered');
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone.replace('+', ''),
      passwordHash: '', // OTP login only
      city: data.city,
    },
  });

  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    isProfessional: user.isProfessional,
    professionalStatus: user.professionalStatus,
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
