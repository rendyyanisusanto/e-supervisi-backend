import { z } from 'zod';

export const createScoreRangeSchema = z.object({
  min_score: z.number().min(0).max(100),
  max_score: z.number().min(0).max(100),
  status: z.string().min(1).max(100),
  color: z.string().max(30).optional().nullable(),
  description: z.string().optional().nullable(),
}).superRefine((d, ctx) => {
  if (d.max_score <= d.min_score) {
    ctx.addIssue({ code: 'custom', path: ['max_score'], message: 'Nilai maksimal harus lebih besar dari nilai minimal' });
  }
});

export const updateScoreRangeSchema = z.object({
  min_score: z.number().min(0).max(100).optional(),
  max_score: z.number().min(0).max(100).optional(),
  status: z.string().min(1).max(100).optional(),
  color: z.string().max(30).optional().nullable(),
  description: z.string().optional().nullable(),
});

export type CreateScoreRangeDto = z.infer<typeof createScoreRangeSchema>;
export type UpdateScoreRangeDto = z.infer<typeof updateScoreRangeSchema>;
