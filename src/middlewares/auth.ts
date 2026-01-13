import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

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
      return res.status(401).json({ message: 'User not found' });
    }

    (req as any).user = {
      sub: decoded.sub,
      role: user.role,
      professionalId: user.professionalProfile?.id || null,
      staffProfessionalId: user.staffProfile?.professionalId || null,
      isStaff: user.isStaff,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
