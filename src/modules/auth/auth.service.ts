import prisma from '../../config/database';
import { comparePassword } from '../../common/utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  findValidRefreshToken,
  verifyRefreshToken,
} from '../../common/utils/token';
import { HttpError } from '../../common/middlewares/error.middleware';
import { MESSAGES } from '../../common/constants/messages';
import { LoginDto, UpdateProfileDto } from './auth.validation';
import { hashPassword } from '../../common/utils/password';
import { compressTeacherPhoto, deleteOldFileIfExists } from '../../common/utils/image';

export const authService = {
  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        teacher: {
          include: { mainSubject: true },
        },
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.is_active) {
      throw new HttpError(MESSAGES.ERROR.INVALID_CREDENTIALS, 401);
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpError(MESSAGES.ERROR.INVALID_CREDENTIALS, 401);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    const tokenPayload = {
      sub: Number(user.id),
      teacher_id: Number(user.teacher_id),
      roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await saveRefreshToken(user.id, refreshToken, 7);

    // Update last_login_at
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return {
      user: {
        id: Number(user.id),
        teacher_id: Number(user.teacher_id),
        name: user.name,
        username: user.username,
        email: user.email,
        roles,
        position: user.teacher.position,
        mapel: user.teacher.mainSubject?.name || null,
        photo: user.teacher.photo,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        teacher: {
          include: { mainSubject: true },
        },
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new HttpError(MESSAGES.ERROR.NOT_FOUND, 404);
    }

    return {
      id: Number(user.id),
      teacher_id: Number(user.teacher_id),
      name: user.name,
      username: user.username,
      email: user.email,
      roles: user.userRoles.map((ur) => ur.role.name),
      position: user.teacher.position,
      mapel: user.teacher.mainSubject?.name || null,
      photo: user.teacher.photo,
      last_login_at: user.last_login_at?.toISOString() ?? null,
    };
  },

  async refresh(token: string) {
    const record = await findValidRefreshToken(token);
    if (!record) {
      throw new HttpError(MESSAGES.ERROR.TOKEN_INVALID, 401);
    }

    try {
      verifyRefreshToken(token);
    } catch {
      throw new HttpError(MESSAGES.ERROR.TOKEN_EXPIRED, 401);
    }

    const roles = record.user.userRoles.map((ur) => ur.role.name);
    const tokenPayload = {
      sub: Number(record.user.id),
      teacher_id: Number(record.user.teacher_id),
      roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    await revokeRefreshToken(token);
    await saveRefreshToken(record.user.id, newRefreshToken, 7);

    return { access_token: accessToken, refresh_token: newRefreshToken };
  },

  async logout(userId: number) {
    await revokeAllUserTokens(BigInt(userId));
  },

  async updateProfile(userId: number, dto: UpdateProfileDto, file?: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { teacher: true }
    });

    if (!user) {
      throw new HttpError(MESSAGES.ERROR.NOT_FOUND, 404);
    }

    // Check username conflict
    if (dto.username !== user.username) {
      const existingUser = await prisma.user.findUnique({ where: { username: dto.username } });
      if (existingUser) {
        throw new HttpError('Username sudah digunakan', 400);
      }
    }

    // Update Photo
    let photoUrl = user.teacher.photo;
    if (file) {
      photoUrl = await compressTeacherPhoto(file, user.username);
      // Delete old photo if it exists and it's not the default one
      if (user.teacher.photo && user.teacher.photo !== photoUrl) {
        deleteOldFileIfExists(user.teacher.photo);
      }
    }

    // Password Hash
    let updatePassword = user.password;
    if (dto.password && dto.password.trim() !== '') {
      updatePassword = await hashPassword(dto.password);
    }

    // Transaction to update both User and Teacher
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: BigInt(userId) },
        data: {
          name: dto.name,
          username: dto.username,
          email: dto.email || null,
          password: updatePassword,
        }
      });

      await tx.teacher.update({
        where: { id: user.teacher_id },
        data: {
          name: dto.name,
          email: dto.email || null,
          photo: photoUrl,
        }
      });
    });

    return this.me(userId);
  },
};
