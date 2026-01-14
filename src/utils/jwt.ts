import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  role: 'USER' | 'ADMIN' | 'STAFF';
  isProfessional?: boolean;
  professionalStatus?: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET! as jwt.Secret;
  const expiresIn = (process.env.JWT_ACCESS_EXPIRY || '7d') as jwt.SignOptions['expiresIn'];
  
  return jwt.sign(payload, secret, { expiresIn });
}

export function generateRefreshToken(userId: string): string {
  const secret = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as jwt.Secret;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRY || '30d') as jwt.SignOptions['expiresIn'];
  
  return jwt.sign({ sub: userId }, secret, { expiresIn });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET! as jwt.Secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as jwt.Secret) as { sub: string };
}
