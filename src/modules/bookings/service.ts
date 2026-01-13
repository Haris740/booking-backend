import { PrismaClient, AppointmentType, BookingStatus, Gender } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

export async function createTokenBooking(data: {
    userId: string;
    professionalId: string;
    name: string;
    age: number;
    gender: Gender;
    phone: string;
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

    // Calculate estimated wait time (15 mins per )
    const estimatedWaitTime = (nextTokenNumber - 1) * 15;

    const booking = await prisma.booking.create({
        data: {
            userId: data.userId,
            professionalId: data.professionalId,
            name: data.name,
            age: data.age,
            gender: data.gender,
            phone: data.phone,
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
    name: string;
    age: number;
    gender: Gender;
    phone: string;
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
            name: data.name,
            age: data.age,
            gender: data.gender,
            phone: data.phone,
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

    // Count s before this user
    const sBeforeCount = await prisma.booking.count({
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
        sBeforeYou: sBeforeCount,
        estimatedWaitTime: sBeforeCount * 15, // 15 mins per 
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

export async function callNextToken(professionalId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    await prisma.booking.updateMany({
        where: {
            professionalId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: 'IN_PROGRESS',
        },
        data: { status: 'COMPLETED' },
    });

    const nextBooking = await prisma.booking.findFirst({
        where: {
            professionalId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: 'CONFIRMED',
        },
        orderBy: { tokenNumber: 'asc' },
        include: { user: { select: { name: true, phone: true } } },
    });

    if (!nextBooking) return null;

    const updated = await prisma.booking.update({
        where: { id: nextBooking.id },
        data: { status: 'IN_PROGRESS' },
        include: { user: { select: { name: true, phone: true } } },
    });

    return updated;
}

export async function markNoShow(bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new ApiError(404, 'Booking not found');

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

// Check if user can see "Become Professional" option
export async function canApplyAsProfessional(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            isProfessional: true,
            professionalStatus: true,
            isStaff: true,
        },
    });

    if (!user) throw new ApiError(404, 'User not found');

    // Hide if already professional
    if (user.isProfessional) return { canApply: false, reason: 'Already a professional' };

    // Hide if application pending or approved
    if (user.professionalStatus === 'PENDING') {
        return { canApply: false, reason: 'Application pending approval' };
    }
    if (user.professionalStatus === 'APPROVED') {
        return { canApply: false, reason: 'Already approved as professional' };
    }

    // Hide if user is a staff member
    if (user.isStaff) return { canApply: false, reason: 'Already a staff member' };

    // Can apply if NONE or REJECTED
    return { canApply: true, reason: null };
}

// Invite user to be staff
export async function inviteStaff(professionalId: string, data: { phone: string; message?: string }) {
    // Find user by phone
    const invitedUser = await prisma.user.findUnique({
        where: { phone: data.phone },
    });

    if (!invitedUser) throw new ApiError(404, 'User not found with this phone number');

    // Check if already staff
    const existingStaff = await prisma.staff.findFirst({
        where: {
            professionalId,
            userId: invitedUser.id,
        },
    });

    if (existingStaff) throw new ApiError(400, 'User is already your staff member');

    // Check if invitation already exists
    const existingInvitation = await prisma.staffInvitation.findUnique({
        where: {
            professionalId_invitedUserId: {
                professionalId,
                invitedUserId: invitedUser.id,
            },
        },
    });

    if (existingInvitation) {
        if (existingInvitation.status === 'PENDING') {
            throw new ApiError(400, 'Invitation already sent and pending');
        }
        // Update existing invitation
        const updated = await prisma.staffInvitation.update({
            where: { id: existingInvitation.id },
            data: {
                status: 'PENDING',
                message: data.message,
            },
            include: {
                invitedUser: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });
        return updated;
    }

    // Create new invitation
    const invitation = await prisma.staffInvitation.create({
        data: {
            professionalId,
            invitedUserId: invitedUser.id,
            message: data.message,
        },
        include: {
            invitedUser: {
                select: {
                    id: true,
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
    });

    // TODO: Send notification to user
    return invitation;
}

// Get my staff invitations (for user)
export async function getMyStaffInvitations(userId: string) {
    const invitations = await prisma.staffInvitation.findMany({
        where: {
            invitedUserId: userId,
            status: 'PENDING',
        },
        include: {
            professional: {
                select: {
                    title: true,
                    city: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return invitations;
}

// Accept staff invitation
export async function acceptStaffInvitation(userId: string, invitationId: string) {
    const invitation = await prisma.staffInvitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) throw new ApiError(404, 'Invitation not found');
    if (invitation.invitedUserId !== userId) throw new ApiError(403, 'Not your invitation');
    if (invitation.status !== 'PENDING') throw new ApiError(400, 'Invitation already processed');

    // Create staff record
    await prisma.staff.create({
        data: {
            userId,
            professionalId: invitation.professionalId,
        },
    });

    // Update invitation status
    await prisma.staffInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
    });

    // Update user role and isStaff
    await prisma.user.update({
        where: { id: userId },
        data: {
            isStaff: true,
            role: 'STAFF',
        },
    });

    return { message: 'Staff invitation accepted' };
}

// Reject staff invitation
export async function rejectStaffInvitation(userId: string, invitationId: string) {
    const invitation = await prisma.staffInvitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) throw new ApiError(404, 'Invitation not found');
    if (invitation.invitedUserId !== userId) throw new ApiError(403, 'Not your invitation');
    if (invitation.status !== 'PENDING') throw new ApiError(400, 'Invitation already processed');

    await prisma.staffInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' },
    });

    return { message: 'Staff invitation rejected' };
}

// Get all staff members (for professional)
export async function getMyStaff(professionalId: string) {
    const staff = await prisma.staff.findMany({
        where: { professionalId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    profilePicture: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return staff;
}

// Remove staff member
export async function removeStaff(professionalId: string, staffId: string) {
    const staff = await prisma.staff.findUnique({
        where: { id: staffId },
    });

    if (!staff) throw new ApiError(404, 'Staff not found');
    if (staff.professionalId !== professionalId) throw new ApiError(403, 'Not your staff member');

    await prisma.staff.delete({
        where: { id: staffId },
    });

    // Update user
    await prisma.user.update({
        where: { id: staff.userId },
        data: {
            isStaff: false,
            role: 'USER',
        },
    });

    return { message: 'Staff member removed' };
}