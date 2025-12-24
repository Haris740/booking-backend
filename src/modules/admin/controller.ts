import { Request, Response, NextFunction } from 'express';
import * as adminService from './service';

export async function listPendingController(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await adminService.listPendingProfessionals(page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProfessionalController(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await adminService.getProfessionalDetails(req.params.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function approveProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const adminId = (req as any).user!.sub;
    const profile = await adminService.approveProfessional(
      req.params.id,
      adminId,
      req.body.adminNote
    );
    res.json({ profile, message: 'Professional approved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function rejectProfessionalController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const adminId = (req as any).user!.sub;
    const profile = await adminService.rejectProfessional(
      req.params.id,
      adminId,
      req.body.adminNote
    );
    res.json({ profile, message: 'Professional rejected' });
  } catch (error) {
    next(error);
  }
}
