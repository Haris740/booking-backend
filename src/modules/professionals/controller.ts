import { Request, Response, NextFunction } from 'express';
import * as professionalService from './service';
import { applyProfessionalSchema, listProfessionalsQuerySchema } from './validators';

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

export async function getMyProfessionalProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user!.sub;
    const profile = await professionalService.getMyProfessionalProfile(userId);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function listProfessionalsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = listProfessionalsQuerySchema.parse(req.query);
    const result = await professionalService.listProfessionals(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
