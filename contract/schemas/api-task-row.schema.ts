import {z} from 'zod';

const dateKey = /^\d{4}-\d{2}-\d{2}$/;

export const apiTaskRowSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.enum(['pending', 'completed']),
    taskDate: z.union([z.string().regex(dateKey), z.null()]),
    contentJson: z
      .string()
      .min(1, 'expected non-empty string')
      .refine((s) => {
        try {
          JSON.parse(s);
          return true;
        } catch {
          return false;
        }
      }, 'invalid JSON'),
    contentText: z.string(),
    checklistTotal: z.number().int().min(0),
    checklistCompleted: z.number().int().min(0),
    priority: z.enum(['low', 'normal', 'high']),
    estimateMinutes: z.union([
      z.null(),
      z
        .number()
        .int()
        .positive()
        .max(24 * 60),
    ]),
    pinned: z.boolean(),
    timeSpentSeconds: z.number().int().min(0),
    timerStartedAt: z.union([
      z.null(),
      z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'expected parseable ISO string'),
    ]),
    recurrence: z.union([z.null(), z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly'])]),
    categoryId: z.union([z.null(), z.string().uuid()]),
    createdAt: z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), 'expected parseable ISO string'),
    updatedAt: z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), 'expected parseable ISO string'),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (row.checklistCompleted > row.checklistTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['checklistCompleted'],
        message: 'expected integer 0…checklistTotal',
      });
    }
  });

export type ApiTaskRow = z.infer<typeof apiTaskRowSchema>;
