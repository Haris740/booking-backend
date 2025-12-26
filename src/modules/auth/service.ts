import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/apiError';
import { sendOtpFirebase, verifyOtpFirebase } from '../../utils/sms';

const prisma = new PrismaClient();

// Store Firebase session info
const sessionStore: { 
  [phone: string]: { 
    sessionInfo: string; 
    expires: number;
  } 
} = {};

export async function sendOtp(phone: string) {
  // Validate phone
  const cleanPhone = phone.replace(/[\+\s\-]/g, '');
  if (!cleanPhone.startsWith('91') || cleanPhone.length !== 12) {
    throw new ApiError(400, 'Invalid Indian phone number. Use +91XXXXXXXXXX');
  }

  try {
    // Send via Firebase
    const { sessionInfo } = await sendOtpFirebase(phone);
    
    // Store session (5 min expiry)
    sessionStore[phone] = {
      sessionInfo,
      expires: Date.now() + 5 * 60 * 1000,
    };

    return { 
      message: 'OTP sent successfully',
      note: 'Enter the test OTP you configured in Firebase Console'
    };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    throw new ApiError(500, error.message || 'Failed to send OTP');
  }
}

export async function verifyOtp(phone: string, otp: string) {
  const session = sessionStore[phone];
  
  if (!session || Date.now() > session.expires) {
    throw new ApiError(400, 'Session expired. Request new OTP');
  }

  try {
    // Verify with Firebase
    await verifyOtpFirebase(session.sessionInfo, otp);
    
    // Clear session
    delete sessionStore[phone];
  } catch (error) {
    throw new ApiError(400, 'Invalid OTP');
  }

  // Find or create user
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
