import { Request, Response, NextFunction } from 'express';
import * as bookingService from './service';

export async function createBookingController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user!.sub;
        const booking = await bookingService.createBooking(userId, req.body);
        res.status(201).json({ booking });
    } catch (error) {
        next(error);
    }
}

export async function getUserBookingsController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user!.sub;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const result = await bookingService.getUserBookings(userId, page, limit);
        res.json(result);
    } catch (error) {
        next(error);
    }
}
