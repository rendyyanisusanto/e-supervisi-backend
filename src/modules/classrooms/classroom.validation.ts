import { z } from 'zod';

export const createClassroomSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi').max(100),
  grade: z.string().max(20).optional().nullable(),
  major: z.string().max(100).optional().nullable(),
  homeroom_teacher_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateClassroomSchema = createClassroomSchema.partial();
export type CreateClassroomDto = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomDto = z.infer<typeof updateClassroomSchema>;
