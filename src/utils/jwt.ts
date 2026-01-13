import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  sub: string;
  role: 'USER' | 'ADMIN' | 'STAFF';
  isProfessional: boolean;
  professionalStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, { 
    expiresIn: config.jwt.accessExpiry as any 
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwt.refreshSecret, { 
    expiresIn: config.jwt.refreshExpiry as any 
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}
