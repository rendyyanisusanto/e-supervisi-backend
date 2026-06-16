import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(100),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token wajib diisi'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(150),
  username: z.string().min(1, 'Username wajib diisi').max(100),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
