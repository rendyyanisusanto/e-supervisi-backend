import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { MESSAGES } from '../../common/constants/messages';
import { UpdateProfileDto, ChangePasswordDto } from './profile.validation';
import { hashPassword, comparePassword } from '../../common/utils/password';
import { compressTeacherPhoto, deleteOldFileIfExists } from '../../common/utils/image';

export const profileService = {
  async getProfile(userId: number) {
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

    // Get school profile
    const schoolProfile = await prisma.schoolProfile.findFirst();

    return {
      id: Number(user.id),
      teacher_id: Number(user.teacher_id),
      name: user.name,
      username: user.username,
      email: user.email,
      roles: user.userRoles.map((ur: any) => ur.role.name),
      position: user.teacher.position,
      mapel: user.teacher.mainSubject?.name || null,
      photo: user.teacher.photo,
      nip: user.teacher.nip,
      phone: user.teacher.phone,
      sekolah: schoolProfile?.name || 'SMK Negeri',
      last_login_at: user.last_login_at?.toISOString() ?? null,
    };
  },

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { teacher: true }
    });

    if (!user) {
      throw new HttpError(MESSAGES.ERROR.NOT_FOUND, 404);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: BigInt(userId) },
        data: {
          name: dto.name,
          email: dto.email || null,
        }
      });

      await tx.teacher.update({
        where: { id: user.teacher_id },
        data: {
          name: dto.name,
          email: dto.email || null,
          phone: dto.phone || null,
        }
      });
    });

    return this.getProfile(userId);
  },

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) }
    });

    if (!user) {
      throw new HttpError(MESSAGES.ERROR.NOT_FOUND, 404);
    }

    const isPasswordValid = await comparePassword(dto.old_password, user.password);
    if (!isPasswordValid) {
      throw new HttpError('Password lama tidak sesuai', 400);
    }

    const newHashedPassword = await hashPassword(dto.new_password);

    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { password: newHashedPassword }
    });

    return { success: true };
  },

  async updateAvatar(userId: number, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { teacher: true }
    });

    if (!user) {
      throw new HttpError(MESSAGES.ERROR.NOT_FOUND, 404);
    }

    const photoUrl = await compressTeacherPhoto(file, user.username);
    
    // Delete old photo
    if (user.teacher.photo && user.teacher.photo !== photoUrl) {
      deleteOldFileIfExists(user.teacher.photo);
    }

    await prisma.teacher.update({
      where: { id: user.teacher_id },
      data: { photo: photoUrl }
    });

    return { photo: photoUrl };
  },

  async removeAvatar(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { teacher: true }
    });

    if (!user) {
      throw new HttpError(MESSAGES.ERROR.NOT_FOUND, 404);
    }

    if (user.teacher.photo) {
      deleteOldFileIfExists(user.teacher.photo);
    }

    await prisma.teacher.update({
      where: { id: user.teacher_id },
      data: { photo: null }
    });

    return { photo: null };
  }
};
