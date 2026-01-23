import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export async function getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            professionalProfile: {
                select: {
                    id: true,
                    title: true,
                    city: true,
                    status: true,
                    baseFee: true,
                    bookingType: true,
                    category: {
                        select: {
                            name: true,
                            professionType: true,
                        },
                    },
                },
            },
            staffProfile: {
                select: {
                    id: true,
                    professionalId: true,
                    professional: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        phone: user.phone,
        profilePicture: user.profilePicture,
        isProfessional: user.isProfessional,
        professionalStatus: user.professionalStatus,
        professionalId: user.professionalProfile?.id || null,
        professional: user.professionalProfile || null,
        isStaff: user.isStaff,
        staffProfile: user.staffProfile || null,
    };
}

export async function updateUserProfile(userId: string, updates: any) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            name: updates.name,
            email: updates.email,
            city: updates.city,
            profilePicture: updates.profilePicture,
        },
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        profilePicture: user.profilePicture,
    };
}
