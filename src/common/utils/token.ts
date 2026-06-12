import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, JwtPayload } from '../../config/jwt';
import prisma from '../../config/database';

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
export type { JwtPayload };

export const saveRefreshToken = async (userId: bigint, token: string, expiresInDays = 7) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return prisma.refreshToken.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });
};

export const revokeRefreshToken = async (token: string) => {
  return prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked_at: new Date() },
  });
};

export const revokeAllUserTokens = async (userId: bigint) => {
  return prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

export const findValidRefreshToken = async (token: string) => {
  return prisma.refreshToken.findFirst({
    where: {
      token,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    include: { user: { include: { userRoles: { include: { role: true } } } } },
  });
};
