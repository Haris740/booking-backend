import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('🔐 Auth Header:', req.headers.authorization);
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🎫 Token:', token.substring(0, 20) + '...');
    console.log('🔑 JWT_ACCESS_SECRET exists:', !!process.env.JWT_ACCESS_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    console.log('✅ Token decoded:', decoded);

    // Fetch user with professional profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        professionalProfile: {
          select: { id: true },
        },
      },
    });

    console.log('👤 User found:', user ? user.id : 'NOT FOUND');

    if (!user) {
      console.log('❌ User not in database');
      return res.status(401).json({ message: 'User not found' });
    }

    (req as any).user = {
      sub: decoded.sub,
      role: user.role,
      professionalId: user.professionalProfile?.id || null,
    };

    next();
  } catch (error: any) {
    console.error('🚨 Auth Error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
