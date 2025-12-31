import { PrismaClient, AppointmentType, BookingStatus, Gender } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export async function createTokenBooking(data: {
    userId: string;
    professionalId: string;
    patientName: string;
    patientAge: number;
    patientGender: Gender;
    patientPhone: string;
    disease?: string;
    symptoms?: string;
    appointmentDate: Date;
}) {
    // Verify professional exists
    const professional = await prisma.professionalProfile.findUnique({
        where: { id: data.professionalId },
    });

    if (!professional) throw new ApiError(404, 'Professional not found');
    if (professional.status !== 'APPROVED') {
        throw new ApiError(400, 'Professional not approved yet');
    }

    // Get the next token number for this professional on this date
    const startOfDay = new Date(data.appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data.appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const lastBooking = await prisma.booking.findFirst({
        where: {
            professionalId: data.professionalId,
            appointmentDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            appointmentType: 'TOKEN',
            status: { notIn: ['CANCELLED'] },
        },
        orderBy: { tokenNumber: 'desc' },
    });

    const nextTokenNumber = (lastBooking?.tokenNumber || 0) + 1;

    // Check token limit
    if (professional.tokenLimitPerDay && nextTokenNumber > professional.tokenLimitPerDay) {
        throw new ApiError(400, 'Token limit reached for this day');
    }

    // Calculate estimated wait time (15 mins per patient)
    const estimatedWaitTime = (nextTokenNumber - 1) * 15;

    const booking = await prisma.booking.create({
        data: {
            userId: data.userId,
            professionalId: data.professionalId,
            patientName: data.patientName,
            patientAge: data.patientAge,
            patientGender: data.patientGender,
            patientPhone: data.patientPhone,
            disease: data.disease,
            symptoms: data.symptoms,
            appointmentDate: data.appointmentDate,
            appointmentType: 'TOKEN',
            tokenNumber: nextTokenNumber,
            status: 'CONFIRMED',
            estimatedWaitTime,
            notificationsSent: {},
        },
        include: {
            professional: {
                select: {
                    user: {
                        select: {
                            name: true,
                            city: true,
                        },
                    },
                    title: true,
                    city: true,
                    address: true,
                    baseFee: true,
                },
            },
        },
    });

    return booking;
}

export async function createTimeSlotBooking(data: {
    userId: string;
    professionalId: string;
    patientName: string;
    patientAge: number;
    patientGender: Gender;
    patientPhone: string;
    disease?: string;
    symptoms?: string;
    appointmentDate: Date;
    timeSlot: string;
}) {
    // Verify professional exists
    const professional = await prisma.professionalProfile.findUnique({
        where: { id: data.professionalId },
    });

    if (!professional) throw new ApiError(404, 'Professional not found');
    if (professional.status !== 'APPROVED') {
        throw new ApiError(400, 'Professional not approved yet');
    }

    // Check if time slot already taken
    const existingBooking = await prisma.booking.findFirst({
        where: {
            professionalId: data.professionalId,
            appointmentDate: data.appointmentDate,
            timeSlot: data.timeSlot,
            status: { notIn: ['CANCELLED'] },
        },
    });

    if (existingBooking) {
        throw new ApiError(400, 'Time slot already booked');
    }

    const booking = await prisma.booking.create({
        data: {
            userId: data.userId,
            professionalId: data.professionalId,
            patientName: data.patientName,
            patientAge: data.patientAge,
            patientGender: data.patientGender,
            patientPhone: data.patientPhone,
            disease: data.disease,
            symptoms: data.symptoms,
            appointmentDate: data.appointmentDate,
            appointmentType: 'TIMESLOT',
            timeSlot: data.timeSlot,
            status: 'CONFIRMED',
            notificationsSent: {},
        },
        include: {
            professional: {
                select: {
                    user: {
                        select: {
                            name: true,
                            city: true,
                        },
                    },
                    title: true,
                    city: true,
                    address: true,
                    baseFee: true,
                },
            },
        },
    });

    return booking;
}

export async function getTokenStatus(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            professional: {
                select: {
                    user: { select: { name: true } },
                    title: true,
                    city: true,
                    address: true,
                },
            },
        },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.userId !== userId) throw new ApiError(403, 'Access denied');

    // Get current token being served
    const currentBooking = await prisma.booking.findFirst({
        where: {
            professionalId: booking.professionalId,
            appointmentDate: booking.appointmentDate,
            status: 'IN_PROGRESS',
        },
    });

    const currentToken = currentBooking?.tokenNumber || 0;

    // Count patients before this user
    const patientsBeforeCount = await prisma.booking.count({
        where: {
            professionalId: booking.professionalId,
            appointmentDate: booking.appointmentDate,
            tokenNumber: { lt: booking.tokenNumber! },
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        },
    });

    return {
        booking,
        currentToken,
        yourToken: booking.tokenNumber,
        patientsBeforeYou: patientsBeforeCount,
        estimatedWaitTime: patientsBeforeCount * 15, // 15 mins per patient
    };
}

export async function getMyBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
        where: { userId },
        include: {
            professional: {
                select: {
                    user: { select: { name: true } },
                    title: true,
                    city: true,
                    address: true,
                },
            },
        },
        orderBy: { appointmentDate: 'desc' },
    });

    return bookings;
}

export async function cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.userId !== userId) throw new ApiError(403, 'Access denied');
    if (booking.status === 'COMPLETED') {
        throw new ApiError(400, 'Cannot cancel completed booking');
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
    });

    return updated;
}

// PROFESSIONAL FUNCTIONS

export async function callNextToken(professionalId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Mark current as completed
    await prisma.booking.updateMany({
        where: {
            professionalId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: 'IN_PROGRESS',
        },
        data: { status: 'COMPLETED' },
    });

    // Get next token
    const nextBooking = await prisma.booking.findFirst({
        where: {
            professionalId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: 'CONFIRMED',
        },
        orderBy: { tokenNumber: 'asc' },
        include: {
            user: { select: { name: true, phone: true } },
        },
    });

    if (!nextBooking) return null;

    // Mark as in progress
    const updated = await prisma.booking.update({
        where: { id: nextBooking.id },
        data: { status: 'IN_PROGRESS' },
        include: {
            user: { select: { name: true, phone: true } },
        },
    });

    // TODO: Send notification to patient
    // await sendNotification(updated.userId, "Doctor is calling you now");

    return updated;
}

export async function markNoShow(bookingId: string, professionalId: string) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.professionalId !== professionalId) throw new ApiError(403, 'Access denied');

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'NO_SHOW' },
    });

    return updated;
}

export async function getTodayQueue(professionalId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
        where: {
            professionalId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: { notIn: ['CANCELLED'] },
        },
        orderBy: { tokenNumber: 'asc' },
        include: {
            user: { select: { name: true, phone: true } },
        },
    });

    const currentToken = bookings.find((b) => b.status === 'IN_PROGRESS')?.tokenNumber || 0;
    const totalTokens = bookings.length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const pending = bookings.filter((b) => b.status === 'CONFIRMED').length;

    return {
        bookings,
        currentToken,
        totalTokens,
        completed,
        pending,
    };
}
