import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(150),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]+$/, 'Nomor HP hanya boleh berisi angka').min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit').optional().or(z.literal('')),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Password lama wajib diisi'),
  new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
