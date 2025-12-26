import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/apiError';
import { sendOtpFirebase, verifyOtpFirebase, sendOtpTest } from '../../utils/sms';

const prisma = new PrismaClient();

// For Firebase flow
const sessionStore: { 
  [phone: string]: { 
    sessionInfo: string; 
    expires: number;
  } 
} = {};

// For test mode
const otpStore: { 
  [phone: string]: { 
    code: string; 
    expires: number;
  } 
} = {};

const USE_FIREBASE = process.env.USE_FIREBASE === 'true';

export async function sendOtp(phone: string) {
  // Validate phone
  const cleanPhone = phone.replace(/[\+\s\-]/g, '');
  if (!cleanPhone.startsWith('91') || cleanPhone.length !== 12) {
    throw new ApiError(400, 'Invalid Indian phone number. Use +91XXXXXXXXXX');
  }

  if (USE_FIREBASE) {
    // FIREBASE MODE
    try {
      const { sessionInfo } = await sendOtpFirebase(phone);
      
      sessionStore[phone] = {
        sessionInfo,
        expires: Date.now() + 5 * 60 * 1000,
      };

      return { 
        message: 'OTP sent to your phone via SMS',
        provider: 'firebase',
      };
    } catch (error) {
      console.error('Firebase error:', error);
      throw new ApiError(500, 'Failed to send OTP');
    }
  } else {
    // TEST MODE
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore[phone] = {
      code,
      expires: Date.now() + 5 * 60 * 1000,
    };

    await sendOtpTest(phone, code);

    return { 
      message: 'OTP sent successfully',
      provider: 'test',
      ...(process.env.NODE_ENV !== 'production' && { 
        otp: code,
        note: 'Test mode: OTP included in response'
      }),
    };
  }
}

export async function verifyOtp(phone: string, otp: string) {
  if (USE_FIREBASE) {
    // FIREBASE VERIFICATION
    const session = sessionStore[phone];
    
    if (!session || Date.now() > session.expires) {
      throw new ApiError(400, 'Session expired');
    }

    try {
      await verifyOtpFirebase(session.sessionInfo, otp);
      delete sessionStore[phone];
    } catch (error) {
      throw new ApiError(400, 'Invalid OTP');
    }
  } else {
    // TEST MODE VERIFICATION
    const otpData = otpStore[phone];
    
    if (!otpData || Date.now() > otpData.expires) {
      throw new ApiError(400, 'OTP expired or invalid');
    }
    
    if (otpData.code !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }

    delete otpStore[phone];
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
