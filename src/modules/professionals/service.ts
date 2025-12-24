import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export type ApplyProfessionalInput = {
  title: string;
  professionType: string;
  categorySlug: string;
  about?: string;
  yearsExperience?: number;
  city: string;
  address?: string;
  consultationMode: string;
  baseFee?: number;
  tags?: string[];
};

export async function applyForProfessional(userId: string, data: ApplyProfessionalInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isProfessional) {
    throw new ApiError(400, 'User is already a professional');
  }

  let category = await prisma.professionalCategory.findUnique({
    where: { slug: data.categorySlug },
  });

  if (!category || category.professionType !== data.professionType) {
    category = await prisma.professionalCategory.create({
      data: {
        name: data.categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug: data.categorySlug,
        professionType: data.professionType,
        description: `${data.professionType} - ${data.categorySlug}`,
      },
    });
  }

  const existingProfile = await prisma.professionalProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new ApiError(400, 'Professional profile already exists');
  }

  const profile = await prisma.$transaction(async (tx: any) => {
    const createdProfile = await tx.professionalProfile.create({
      data: {
        userId,
        title: data.title,
        categoryId: category!.id,
        about: data.about,
        yearsExperience: data.yearsExperience,
        city: data.city,
        address: data.address,
        consultationMode: data.consultationMode as any,
        baseFee: data.baseFee,
        tags: data.tags || [],
        status: 'PENDING',
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        isProfessional: true,
        professionalStatus: 'PENDING',
      },
    });

    return createdProfile;
  });

  return {
    id: profile.id,
    userId: profile.userId,
    title: profile.title,
    city: profile.city,
    consultationMode: profile.consultationMode,
    baseFee: profile.baseFee,
    yearsExperience: profile.yearsExperience,
    status: profile.status,
    category: {
      id: category!.id,
      name: category!.name,
      slug: category!.slug,
      professionType: category!.professionType,
    },
    createdAt: profile.createdAt,
  };
}

export async function getMyProfessionalProfile(userId: string) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId },
    include: {
      category: true,
    },
  });

  return profile;
}

export type ListProfessionalsQuery = {
  city?: string;
  professionType?: string;
  categorySlug?: string;
  q?: string;
  page: number;
  limit: number;
};

export async function listProfessionals(query: ListProfessionalsQuery) {
  const skip = (query.page - 1) * query.limit;

  const where: any = {
    status: 'APPROVED',
  };

  if (query.city) {
    where.city = {
      contains: query.city,
      mode: 'insensitive',
    };
  }

  const [profiles, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      skip,
      take: query.limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            professionType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  return {
    data: profiles,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
