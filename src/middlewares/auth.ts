import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Fetch user with professional profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        professionalProfile: {
          select: { id: true },
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
    };

    next();
  } catch (error) {
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
