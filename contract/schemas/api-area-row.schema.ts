import {z} from 'zod';

export const apiAreaRowSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().refine((n) => n.trim().length > 0, 'expected non-empty string'),
    icon: z.string().regex(/^[a-z0-9-]+$/, 'expected slug'),
    sortIndex: z.number().int().min(0),
    createdAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'expected parseable ISO string'),
  })
  .strict();

export type ApiAreaRow = z.infer<typeof apiAreaRowSchema>;
