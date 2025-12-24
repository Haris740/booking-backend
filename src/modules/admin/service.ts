import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export async function listPendingProfessionals(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const where = { status: 'PENDING' };

  const [profiles, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, professionType: true },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  return {
    data: profiles,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProfessionalDetails(profileId: string) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: profileId },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, 'Professional profile not found');
  }

  return profile;
}

export async function approveProfessional(profileId: string, adminId: string, adminNote?: string) {
  return await prisma.$transaction(async (tx: any) => {
    const profile = await tx.professionalProfile.update({
      where: { id: profileId },
      data: {
        status: 'APPROVED',
        adminNote,
        updatedById: adminId,
      },
      include: {
        category: true,
        user: true,
      },
    });

    await tx.user.update({
      where: { id: profile.userId },
      data: {
        professionalStatus: 'APPROVED',
      },
    });

    return profile;
  });
}

export async function rejectProfessional(profileId: string, adminId: string, adminNote: string) {
  return await prisma.$transaction(async (tx: any) => {
    const profile = await tx.professionalProfile.update({
      where: { id: profileId },
      data: {
        status: 'REJECTED',
        adminNote,
        updatedById: adminId,
      },
      include: {
        category: true,
        user: true,
      },
    });

    await tx.user.update({
      where: { id: profile.userId },
      data: {
        professionalStatus: 'REJECTED',
        isProfessional: false,
      },
    });

    return profile;
  });
}
