import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: z.string().email('Invalid email format'),
        phone: z.string().min(5).max(20).optional(),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
        city: z.string().min(2).max(100).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1),
    }),
});
