import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            role: true,
            isProfessional: true,
            professionalStatus: true,
            createdAt: true,
        },
    });

    if (!user) throw new ApiError(404, 'User not found');
    return user;
}

export async function updateMe(userId: string, data: { name?: string; city?: string }) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.city && { city: data.city }),
        },
        select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            role: true,
            isProfessional: true,
            professionalStatus: true,
            createdAt: true,
        },
    });

    return user;
}
