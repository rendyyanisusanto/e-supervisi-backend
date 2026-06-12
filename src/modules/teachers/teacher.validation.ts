import { z } from 'zod';

export const createTeacherSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(150),
  nip: z.string().max(50).optional().nullable(),
  nuptk: z.string().max(50).optional().nullable(),
  nik: z.string().max(50).optional().nullable(),
  gender: z.enum(['L', 'P']).optional().nullable(),
  email: z.string().email('Email tidak valid').optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  main_subject_id: z.number().int().positive().optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  // User account - optional, create together with teacher
  username: z.string().min(3, 'Username minimal 3 karakter').max(100).optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  roles: z.array(z.string()).optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export const updateRolesSchema = z.object({
  roles: z.array(z.string()).min(1, 'Minimal 1 role wajib dipilih'),
});

export type CreateTeacherDto = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherDto = z.infer<typeof updateTeacherSchema>;
export type UpdateRolesDto = z.infer<typeof updateRolesSchema>;
