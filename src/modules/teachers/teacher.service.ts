import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { hashPassword } from '../../common/utils/password';
import { Request } from 'express';
import { CreateTeacherDto, UpdateTeacherDto, UpdateRolesDto } from './teacher.validation';
import { env } from '../../config/env';

const serializeTeacher = (t: any) => ({
  id: Number(t.id).toString(),
  photo: t.photo ? `${env.APP_URL}/${t.photo}` : null,
  name: t.name,
  nip: t.nip,
  nuptk: t.nuptk,
  nik: t.nik,
  gender: t.gender,
  email: t.email,
  phone: t.phone,
  main_subject_id: t.main_subject_id ? Number(t.main_subject_id).toString() : null,
  mainSubject: t.mainSubject ? { id: Number(t.mainSubject.id).toString(), name: t.mainSubject.name } : null,
  position: t.position,
  is_active: t.is_active,
  userAccount: t.user ? {
    id: Number(t.user.id).toString(),
    username: t.user.username,
    email: t.user.email,
    is_active: t.user.is_active,
    roles: t.user.userRoles?.map((ur: any) => ur.role.name) ?? [],
    last_login_at: t.user.last_login_at?.toISOString() ?? null,
  } : null,
  created_at: t.created_at?.toISOString(),
  updated_at: t.updated_at?.toISOString(),
});

const teacherInclude = {
  mainSubject: { select: { id: true, name: true } },
  user: { include: { userRoles: { include: { role: true } } } },
};

export const teacherService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = (req.query.search as string) || '';
    const isActive = req.query.is_active;
    const role = req.query.role as string;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search } }, { nip: { contains: search } }];
    if (isActive !== undefined) where.is_active = isActive === 'true';
    if (role) {
      where.user = { userRoles: { some: { role: { name: role } } } };
    }

    const [data, total] = await Promise.all([
      prisma.teacher.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: teacherInclude }),
      prisma.teacher.count({ where }),
    ]);
    return { data: data.map(serializeTeacher), meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const teacher = await prisma.teacher.findUnique({ where: { id: BigInt(id) }, include: teacherInclude });
    if (!teacher) throw new HttpError('Guru tidak ditemukan', 404);
    return serializeTeacher(teacher);
  },

  async create(dto: CreateTeacherDto) {
    const teacher = await prisma.$transaction(async (tx) => {
      const newTeacher = await tx.teacher.create({
        data: {
          name: dto.name,
          nip: dto.nip ?? null,
          nuptk: dto.nuptk ?? null,
          nik: dto.nik ?? null,
          gender: dto.gender as any ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          main_subject_id: dto.main_subject_id ? BigInt(dto.main_subject_id) : null,
          position: dto.position ?? null,
          is_active: dto.is_active ?? true,
        },
      });

      if (dto.username) {
        const existingUser = await tx.user.findUnique({ where: { username: dto.username } });
        if (existingUser) throw new HttpError('Username sudah digunakan', 409);

        const hashedPassword = await hashPassword(dto.password || 'admin123');
        const user = await tx.user.create({
          data: {
            teacher_id: newTeacher.id,
            username: dto.username,
            password: hashedPassword,
            name: newTeacher.name,
            email: newTeacher.email,
            is_active: true,
          },
        });

        if (dto.roles && dto.roles.length > 0) {
          const roles = await tx.role.findMany({ where: { name: { in: dto.roles } } });
          await tx.userRole.createMany({
            data: roles.map((r) => ({ user_id: user.id, role_id: r.id })),
          });
        }
      }

      return tx.teacher.findUnique({ where: { id: newTeacher.id }, include: teacherInclude });
    });

    return serializeTeacher(teacher);
  },

  async update(id: string, dto: UpdateTeacherDto) {
    const existing = await prisma.teacher.findUnique({ where: { id: BigInt(id) }, include: { user: true } });
    if (!existing) throw new HttpError('Guru tidak ditemukan', 404);

    const teacher = await prisma.$transaction(async (tx) => {
      const updatedTeacher = await tx.teacher.update({
        where: { id: BigInt(id) },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.nip !== undefined && { nip: dto.nip }),
          ...(dto.nuptk !== undefined && { nuptk: dto.nuptk }),
          ...(dto.nik !== undefined && { nik: dto.nik }),
          ...(dto.gender !== undefined && { gender: dto.gender as any }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.main_subject_id !== undefined && { main_subject_id: dto.main_subject_id ? BigInt(dto.main_subject_id) : null }),
          ...(dto.position !== undefined && { position: dto.position }),
          ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        },
      });

      if (dto.username && !existing.user) {
        const existingUser = await tx.user.findUnique({ where: { username: dto.username } });
        if (existingUser) throw new HttpError('Username sudah digunakan', 409);

        const hashedPassword = await hashPassword(dto.password || 'admin123');
        const user = await tx.user.create({
          data: {
            teacher_id: updatedTeacher.id,
            username: dto.username,
            password: hashedPassword,
            name: updatedTeacher.name,
            email: updatedTeacher.email,
            is_active: true,
          },
        });

        if (dto.roles && dto.roles.length > 0) {
          const roles = await tx.role.findMany({ where: { name: { in: dto.roles } } });
          await tx.userRole.createMany({
            data: roles.map((r) => ({ user_id: user.id, role_id: r.id })),
          });
        }
      }

      return tx.teacher.findUnique({ where: { id: updatedTeacher.id }, include: teacherInclude });
    });

    return serializeTeacher(teacher);
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.teacher.delete({ where: { id: BigInt(id) } });
  },

  async toggleStatus(id: string) {
    const teacher = await prisma.teacher.findUnique({ where: { id: BigInt(id) } });
    if (!teacher) throw new HttpError('Guru tidak ditemukan', 404);
    const updated = await prisma.teacher.update({ where: { id: BigInt(id) }, data: { is_active: !teacher.is_active }, include: teacherInclude });
    return serializeTeacher(updated);
  },

  async updateRoles(id: string, dto: UpdateRolesDto) {
    const teacher = await prisma.teacher.findUnique({ where: { id: BigInt(id) }, include: { user: true } });
    if (!teacher) throw new HttpError('Guru tidak ditemukan', 404);
    if (!teacher.user) throw new HttpError('Guru belum memiliki akun', 400);

    const roles = await prisma.role.findMany({ where: { name: { in: dto.roles } } });
    if (roles.length !== dto.roles.length) throw new HttpError('Beberapa role tidak ditemukan', 400);

    await prisma.userRole.deleteMany({ where: { user_id: teacher.user.id } });
    await prisma.userRole.createMany({
      data: roles.map((r) => ({ user_id: teacher.user!.id, role_id: r.id })),
    });

    const updated = await prisma.teacher.findUnique({ where: { id: BigInt(id) }, include: teacherInclude });
    return serializeTeacher(updated);
  },

  async resetPassword(id: string) {
    const teacher = await prisma.teacher.findUnique({ where: { id: BigInt(id) }, include: { user: true } });
    if (!teacher) throw new HttpError('Guru tidak ditemukan', 404);
    if (!teacher.user) throw new HttpError('Guru belum memiliki akun', 400);

    const hashedPassword = await hashPassword('admin123');
    await prisma.user.update({ where: { id: teacher.user.id }, data: { password: hashedPassword } });
  },

  async updatePhoto(id: string, photoPath: string) {
    await this.getById(id);
    const updated = await prisma.teacher.update({ where: { id: BigInt(id) }, data: { photo: photoPath }, include: teacherInclude });
    return serializeTeacher(updated);
  },
};
