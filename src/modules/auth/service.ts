import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/apiError';
import { sendOtpFirebase, verifyOtpFirebase } from '../../utils/sms';
import jwt from 'jsonwebtoken';

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
    include: {
      professionalProfile: {
        select: { id: true },
      },
      staffProfile: {
        select: { id: true, professionalId: true },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: `User ${phone.slice(-4)}`,
        phone: phone.replace(/[\+\s\-]/g, ''),
        passwordHash: '',
        city: 'Unknown',
      } as any,
      include: {
        professionalProfile: {
          select: { id: true },
        },
        staffProfile: {
          select: { id: true, professionalId: true },
        },
      },
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
      email: user.email,
      profilePicture: user.profilePicture,
      city: user.city,
      role: user.role,
      isProfessional: user.isProfessional,
      professionalStatus: user.professionalStatus,
      isStaff: user.isStaff,
      professionalId: user.professionalProfile?.id || null,
      staffProfessionalId: user.staffProfile?.professionalId || null,
      createdAt: user.createdAt,
    },
    tokens: { 
      accessToken, 
      refreshToken 
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
    ) as any;

    // Get user with latest data
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        professionalProfile: {
          select: { id: true },
        },
        staffProfile: {
          select: { id: true, professionalId: true },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Generate new tokens
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      isProfessional: user.isProfessional,
      professionalStatus: user.professionalStatus as any,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        isProfessional: user.isProfessional,
        professionalStatus: user.professionalStatus,
        isStaff: user.isStaff,
        professionalId: user.professionalProfile?.id || null,
        staffProfessionalId: user.staffProfile?.professionalId || null,
      },
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Refresh token expired. Please login again');
    }
    throw new ApiError(401, 'Invalid refresh token');
  }
}

export async function registerUser(
  userId: string, 
  data: { name?: string; email?: string; city?: string }
) {
  // Validate name
  if (!data.name || !data.name.trim()) {
    throw new ApiError(400, 'Name is required');
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      city: data.city?.trim() || null,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      phone: user.phone,
    },
  };
}