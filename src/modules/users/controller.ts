import { Request, Response, NextFunction } from 'express';
import * as userService from './service';

export async function getMeController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user!.sub;
        const user = await userService.getUserProfile(userId);

        res.json({ user });
    } catch (error) {
        next(error);
    }
}

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user!.sub;
        const updates = req.body;

        const user = await userService.updateUserProfile(userId, updates);

        res.json({ user });
    } catch (error) {
        next(error);
    }
}
