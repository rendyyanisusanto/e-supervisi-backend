import { z } from 'zod';

export const createPeriodSchema = z.object({
  name: z.string().min(1, 'Nama periode wajib diisi').max(150),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  is_active: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (new Date(data.end_date) <= new Date(data.start_date)) {
    ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'Tanggal akhir harus setelah tanggal mulai' });
  }
});

export const updatePeriodSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_active: z.boolean().optional(),
});

export type CreatePeriodDto = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodDto = z.infer<typeof updatePeriodSchema>;
