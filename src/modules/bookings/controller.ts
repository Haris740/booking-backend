import { Request, Response, NextFunction } from 'express';
import * as bookingService from './service';

export async function createTokenBookingController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).user!.sub;
        const booking = await bookingService.createTokenBooking({
            ...req.body,
            userId,
            appointmentDate: new Date(req.body.appointmentDate),
        });
        res.status(201).json({ booking });
    } catch (error) {
        next(error);
    }
}

export async function createTimeSlotBookingController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).user!.sub;
        const booking = await bookingService.createTimeSlotBooking({
            ...req.body,
            userId,
            appointmentDate: new Date(req.body.appointmentDate),
        });
        res.status(201).json({ booking });
    } catch (error) {
        next(error);
    }
}

export async function getTokenStatusController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).user!.sub;
        const { bookingId } = req.params;
        const status = await bookingService.getTokenStatus(bookingId, userId);
        res.json(status);
    } catch (error) {
        next(error);
    }
}

export async function getMyBookingsController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).user!.sub;
        const bookings = await bookingService.getMyBookings(userId);
        res.json({ bookings });
    } catch (error) {
        next(error);
    }
}

export async function cancelBookingController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).user!.sub;
        const { bookingId } = req.params;
        const booking = await bookingService.cancelBooking(bookingId, userId);
        res.json({ booking });
    } catch (error) {
        next(error);
    }
}

// PROFESSIONAL CONTROLLERS

export async function callNextTokenController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const professionalId = (req as any).user!.professionalId;
        if (!professionalId) {
            return res.status(403).json({ message: 'Not a professional' });
        }
        const { date } = req.body;
        const nextToken = await bookingService.callNextToken(
            professionalId,
            new Date(date || new Date())
        );
        res.json({ nextToken });
    } catch (error) {
        next(error);
    }
}

export async function markNoShowController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const professionalId = (req as any).user!.professionalId;
        if (!professionalId) {
            return res.status(403).json({ message: 'Not a professional' });
        }
        const { bookingId } = req.params;
        const booking = await bookingService.markNoShow(bookingId, professionalId);
        res.json({ booking });
    } catch (error) {
        next(error);
    }
}

export async function getTodayQueueController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const professionalId = (req as any).user!.professionalId;
        if (!professionalId) {
            return res.status(403).json({ message: 'Not a professional' });
        }
        const queue = await bookingService.getTodayQueue(professionalId);
        res.json(queue);
    } catch (error) {
        next(error);
    }
}
