import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'WORKER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createShiftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(), // ISO string
  endTime: z.string().datetime(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export const clockSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
