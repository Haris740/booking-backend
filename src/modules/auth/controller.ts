import { Request, Response, NextFunction } from 'express';
import * as authService from './service';
import { registerSchema, loginSchema } from './validators';

export async function registerController(
    req: Request<{}, {}, any>,
    res: Response,
    next: NextFunction
) {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function loginController(
    req: Request<{}, {}, any>,
    res: Response,
    next: NextFunction
) {
    try {
        const result = await authService.login(req.body.email, req.body.password);
        res.json(result);
    } catch (error) {
        next(error);
    }
}
