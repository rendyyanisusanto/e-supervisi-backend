import { z } from 'zod';

export const submitReflectionSchema = z.object({
  strength_reflection: z.string().min(1, 'Kekuatan wajib diisi'),
  obstacle_reflection: z.string().min(1, 'Hambatan wajib diisi'),
  improvement_plan: z.string().min(1, 'Rencana perbaikan wajib diisi'),
  support_needed: z.string().optional().nullable(),
  target_date: z.string().optional().nullable()
});

export type SubmitReflectionDto = z.infer<typeof submitReflectionSchema>;
