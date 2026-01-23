import { Request, Response, NextFunction } from 'express';
import * as professionalService from './service';

export async function applyProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user!.sub;
    const profile = await professionalService.applyForProfessional(userId, req.body);
    res.status(201).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function canApplyAsProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user!.sub;
    const result = await professionalService.canApplyAsProfessional(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function inviteStaffController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const professionalId = (req as any).user!.professionalId;
    if (!professionalId) {
      return res.status(403).json({ message: 'Not a professional' });
    }
    const invitation = await professionalService.inviteStaff(professionalId, req.body);
    res.status(201).json({ invitation });
  } catch (error) {
    next(error);
  }
}

export async function getMyStaffInvitationsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user!.sub;
    const invitations = await professionalService.getMyStaffInvitations(userId);
    res.json({ invitations });
  } catch (error) {
    next(error);
  }
}

export async function acceptStaffInvitationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user!.sub;
    const { invitationId } = req.params;
    const result = await professionalService.acceptStaffInvitation(userId, invitationId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function rejectStaffInvitationController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user!.sub;
    const { invitationId } = req.params;
    const result = await professionalService.rejectStaffInvitation(userId, invitationId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMyStaffController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const professionalId = (req as any).user!.professionalId;
    if (!professionalId) {
      return res.status(403).json({ message: 'Not a professional' });
    }
    const staff = await professionalService.getMyStaff(professionalId);
    res.json({ staff });
  } catch (error) {
    next(error);
  }
}

export async function removeStaffController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const professionalId = (req as any).user!.professionalId;
    if (!professionalId) {
      return res.status(403).json({ message: 'Not a professional' });
    }
    const { staffId } = req.params;
    const result = await professionalService.removeStaff(professionalId, staffId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await professionalService.getAllCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function getAllProfessionalsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { 
      page, 
      limit, 
      city, 
      categoryId, 
      search, 
      status 
    } = req.query;

    const result = await professionalService.getAllProfessionals({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      city: city as string,
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      search: search as string,
      status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Professional ID is required' 
      });
    }

    const professional = await professionalService.getProfessionalById(id);
    
    res.json({
      success: true,
      professional,
    });
  } catch (error) {
    next(error);
  }
}