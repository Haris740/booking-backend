import { z } from 'zod';

export const applyProfessionalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  professionType: z.string().min(2, 'Profession type required'),
  categorySlug: z.string().min(2, 'Category slug required'),
  about: z.string().max(2000).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  city: z.string().min(2, 'City required').max(100),
  address: z.string().max(500).optional(),
  consultationMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH']),
  baseFee: z.number().int().min(0).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
});

export const listProfessionalsQuerySchema = z.object({
  city: z.string().optional(),
  professionType: z.string().optional(),
  categorySlug: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});
