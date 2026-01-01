import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPendingProfessionalsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const professionals = await prisma.professionalProfile.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ professionals });
  } catch (error) {
    next(error);
  }
}

export async function approveProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const professional = await prisma.professionalProfile.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminNote,
      },
      include: {
        user: true,
      },
    });

    // Update user's isProfessional and professionalStatus
    await prisma.user.update({
      where: { id: professional.userId },
      data: {
        isProfessional: true,
        professionalStatus: 'APPROVED',
        adminNote,
      },
    });

    res.json({ professional });
  } catch (error) {
    next(error);
  }
}

export async function rejectProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const professional = await prisma.professionalProfile.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote,
      },
    });

    // Update user's professionalStatus
    await prisma.user.update({
      where: { id: professional.userId },
      data: {
        professionalStatus: 'REJECTED',
        adminNote,
      },
    });

    res.json({ professional });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsersController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        isProfessional: true,
        professionalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function getAllBookingsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        professional: {
          select: {
            title: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100
    });

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
}
