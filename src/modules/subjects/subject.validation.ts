import { z } from 'zod';

export const createSubjectSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi').max(50),
  name: z.string().min(1, 'Nama wajib diisi').max(150),
  group_name: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateSubjectSchema = createSubjectSchema.partial();
export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;
