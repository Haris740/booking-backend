import { Request, Response, NextFunction } from 'express';
import * as userService from './service';

export async function getMeController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user!.sub;
        const user = await userService.getMe(userId);
        res.json({ user });
    } catch (error) {
        next(error);
    }
}

export async function updateMeController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user!.sub;
        const user = await userService.updateMe(userId, req.body);
        res.json({ user });
    } catch (error) {
        next(error);
    }
}
