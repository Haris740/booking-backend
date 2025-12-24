import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/apiError';
import { generateAccessToken, generateRefreshToken, JwtPayload } from '../../utils/jwt';
import { config } from '../../config';

const prisma = new PrismaClient();

export async function register(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  city?: string;
}) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, 'User already exists with this email or phone');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
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
      email: user.email,
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

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
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
      email: user.email,
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
