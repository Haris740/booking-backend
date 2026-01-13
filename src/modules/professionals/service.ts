import { PrismaClient } from '@prisma/client';
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