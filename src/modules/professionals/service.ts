import { PrismaClient, ConsultationMode, AppointmentType } from '@prisma/client';
import { ApiError } from '../../utils/apiError';

const prisma = new PrismaClient();

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

export async function getAllCategories() {
  const categories = await prisma.professionalCategory.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      professionType: true,
      _count: {
        select: {
          profiles: true,
        },
      },
    },
  });

  return categories;
}

export interface ApplyProfessionalInput {
  title: string;
  categoryId: number;
  city: string;
  address?: string;
  about?: string;
  yearsExperience?: number;
  consultationMode?: ConsultationMode;
  baseFee: number;
  tags?: string[];
  proof: string;
  bookingType: AppointmentType;
  tokenLimitPerDay?: number;
  availableDays?: string[];
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export async function applyForProfessional(userId: string, data: ApplyProfessionalInput) {
  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if already professional
  if (user.isProfessional) {
    throw new ApiError(400, 'User is already a professional');
  }

  // Check for existing profile
  const existingProfile = await prisma.professionalProfile.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new ApiError(400, 'Professional profile already exists');
  }

  // ✅ ADD THIS SECTION - VALIDATE & CONVERT categoryId
  if (!data.categoryId) {
    throw new ApiError(400, 'categoryId is required');
  }

  const categoryId = typeof data.categoryId === 'string' 
    ? parseInt(data.categoryId) 
    : data.categoryId;

  if (isNaN(categoryId)) {
    throw new ApiError(400, 'categoryId must be a valid number');
  }

  // Verify category exists
  const category = await prisma.professionalCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(400, 'Invalid categoryId. Category not found.');
  }
  // ✅ END OF NEW SECTION

  // Validate required fields
  if (!data.title?.trim()) {
    throw new ApiError(400, 'title is required');
  }
  if (!data.city?.trim()) {
    throw new ApiError(400, 'city is required');
  }
  if (!data.baseFee || data.baseFee < 0) {
    throw new ApiError(400, 'baseFee must be a positive number');
  }
  if (!data.bookingType) {
    throw new ApiError(400, 'bookingType is required');
  }

  // Create profile with transaction
  const profile = await prisma.$transaction(async (tx) => {
    const createdProfile = await tx.professionalProfile.create({
      data: {
        userId,
        title: data.title.trim(),
        categoryId: categoryId,  // ✅ NOW DEFINED
        about: data.about?.trim() || null,
        yearsExperience: data.yearsExperience || 0,
        city: data.city.trim(),
        address: data.address?.trim() || null,
        consultationMode: (data.consultationMode || 'OFFLINE') as ConsultationMode,
        baseFee: data.baseFee,
        tags: data.tags || [],
        proof: data.proof?.trim() || null,
        bookingType: data.bookingType,
        tokenLimitPerDay: data.tokenLimitPerDay || 50,
        availableDays: data.availableDays || [],
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        breakStartTime: data.breakStartTime || null,
        breakEndTime: data.breakEndTime || null,
        status: 'PENDING',
      },
      include: {
        category: true,
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

  // Return response
  return {
    id: profile.id,
    userId: profile.userId,
    title: profile.title,
    city: profile.city,
    address: profile.address,
    consultationMode: profile.consultationMode,
    baseFee: profile.baseFee,
    yearsExperience: profile.yearsExperience,
    bookingType: profile.bookingType,
    tokenLimitPerDay: profile.tokenLimitPerDay,
    status: profile.status,
    category: {
      id: profile.category.id,
      name: profile.category.name,
      slug: profile.category.slug,
      professionType: profile.category.professionType,
    },
    createdAt: profile.createdAt,
  };
}

export async function getAllProfessionals(params?: {
  page?: number;
  limit?: number;
  city?: string;
  categoryId?: number;
  search?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (params?.status) {
    where.status = params.status;
  }

  if (params?.city) {
    where.city = {
      contains: params.city,
      mode: 'insensitive',
    };
  }

  if (params?.categoryId) {
    where.categoryId = params.categoryId;
  }

  if (params?.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { city: { contains: params.search, mode: 'insensitive' } },
      { address: { contains: params.search, mode: 'insensitive' } },
      { user: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  // Get total count
  const total = await prisma.professionalProfile.count({ where });

  // Get professionals
  const professionals = await prisma.professionalProfile.findMany({
    where,
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
          phone: true,
          email: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  return {
    professionals,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getProfessionalById(professionalId: string) {
  const professional = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          professionType: true,
          description: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePicture: true,
          city: true,
        },
      },
      staffMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              profilePicture: true,
            },
          },
        },
      },
      proBookings: {
        where: {
          status: { notIn: ['CANCELLED'] },
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: {
          id: true,
          tokenNumber: true,
          status: true,
          appointmentDate: true,
          appointmentType: true,
        },
        orderBy: { tokenNumber: 'asc' },
        take: 5, // Show next 5 bookings
      },
    },
  });

  if (!professional) {
    throw new ApiError(404, 'Professional not found');
  }

  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStats = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      professionalId,
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    _count: true,
  });

  const stats = {
    totalToday: todayStats.reduce((sum, stat) => sum + stat._count, 0),
    completed: todayStats.find(s => s.status === 'COMPLETED')?._count || 0,
    pending: todayStats.find(s => s.status === 'CONFIRMED')?._count || 0,
    inProgress: todayStats.find(s => s.status === 'IN_PROGRESS')?._count || 0,
    noShow: todayStats.find(s => s.status === 'NO_SHOW')?._count || 0,
  };

  // Get current token
  const currentBooking = professional.proBookings.find(b => b.status === 'IN_PROGRESS');

  return {
    ...professional,
    todayStats: stats,
    currentToken: currentBooking?.tokenNumber || null,
    nextBookings: professional.proBookings,
  };
}