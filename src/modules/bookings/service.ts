import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export async function createBooking(userId: string, data: {
    professionalId: string;
    scheduledFor: string;
    notes?: string;
}) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const professional = await prisma.professionalProfile.findFirst({
        where: { id: data.professionalId, status: 'APPROVED' },
    });
    if (!professional) throw new ApiError(404, 'Professional not found or not approved');

    const booking = await prisma.booking.create({
        data: {
            userId,
            professionalId: data.professionalId,
            scheduledFor: new Date(data.scheduledFor),
            notes: data.notes,
            status: 'PENDING',
        },
        include: {
            user: { select: { id: true, name: true } },
            professional: {
                include: {
                    user: { select: { id: true, name: true } },
                    category: true,
                },
            },
        },
    });

    return booking;
}

export async function getUserBookings(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where: { userId },
            skip,
            take: limit,
            include: {
                professional: {
                    include: {
                        user: { select: { name: true } },
                        category: true,
                    },
                },
            },
            orderBy: { scheduledFor: 'desc' },
        }),
        prisma.booking.count({ where: { userId } }),
    ]);

    return {
        data: bookings,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}
