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
