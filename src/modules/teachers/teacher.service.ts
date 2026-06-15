import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { hashPassword } from '../../common/utils/password';
import { Request } from 'express';
import { CreateTeacherDto, UpdateTeacherDto, UpdateRolesDto } from './teacher.validation';
import { env } from '../../config/env';
import * as xlsx from 'xlsx';

const serializeTeacher = (t: any) => ({
  id: Number(t.id).toString(),
  photo: t.photo ? (t.photo.startsWith('http') ? t.photo : `${env.APP_URL}${t.photo.startsWith('/') ? '' : '/'}${t.photo}`) : null,
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
  async getImportTemplate(): Promise<Buffer> {
    const headers = [
      'Nama Lengkap (Wajib)',
      'NIP',
      'NUPTK',
      'NIK',
      'Jenis Kelamin (L/P)',
      'Email',
      'No WA (Wajib)',
      'Jabatan',
      'Username (Opsional)'
    ];
    const ws = xlsx.utils.aoa_to_sheet([headers, ['Budi Santoso, S.Pd.', '198001012010011001', '', '', 'L', 'budi@sekolah.id', '081234567890', 'Guru Matematika', 'budiguru']]);
    
    // Set column widths
    const wscols = [
      { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
    ];
    ws['!cols'] = wscols;

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Guru');
    
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  },

  async importExcel(buffer: Buffer) {
    const wb = xlsx.read(buffer, { type: 'buffer' });
    const wsName = wb.SheetNames[0];
    const ws = wb.Sheets[wsName];
    const data = xlsx.utils.sheet_to_json<any>(ws);

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const defaultRole = await prisma.role.findUnique({ where: { name: 'guru' } });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const name = row['Nama Lengkap (Wajib)'];
      const phone = row['No WA (Wajib)'];
      
      if (!name || !phone) {
        failedCount++;
        errors.push(`Baris ${i + 2}: Nama Lengkap dan No WA wajib diisi`);
        continue;
      }

      const nip = row['NIP'] ? String(row['NIP']).trim() : null;
      const username = row['Username (Opsional)'] ? String(row['Username (Opsional)']).trim() : null;

      try {
        await prisma.$transaction(async (tx) => {
          // Check duplicate NIP
          if (nip) {
            const existNip = await tx.teacher.findFirst({ where: { nip } });
            if (existNip) throw new Error(`NIP ${nip} sudah digunakan`);
          }

          // Check duplicate Username
          if (username) {
            const existUser = await tx.user.findUnique({ where: { username } });
            if (existUser) throw new Error(`Username ${username} sudah digunakan`);
          }

          let genderStr = String(row['Jenis Kelamin (L/P)'] || '').toUpperCase();
          let gender: 'L' | 'P' = 'L';
          if (genderStr === 'P' || genderStr === 'PEREMPUAN') gender = 'P';

          const newTeacher = await tx.teacher.create({
            data: {
              name: String(name).trim(),
              nip: nip,
              nuptk: row['NUPTK'] ? String(row['NUPTK']).trim() : null,
              nik: row['NIK'] ? String(row['NIK']).trim() : null,
              gender: gender,
              email: row['Email'] ? String(row['Email']).trim() : null,
              phone: String(phone).trim(),
              position: row['Jabatan'] ? String(row['Jabatan']).trim() : null,
              is_active: true,
            }
          });

          if (username) {
            const hashedPassword = await hashPassword('admin123');
            const user = await tx.user.create({
              data: {
                teacher_id: newTeacher.id,
                username: username,
                password: hashedPassword,
                name: newTeacher.name,
                email: newTeacher.email,
                is_active: true,
              }
            });

            if (defaultRole) {
              await tx.userRole.create({
                data: { user_id: user.id, role_id: defaultRole.id }
              });
            }
          }
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`Baris ${i + 2} (${name}): ${err.message}`);
      }
    }

    return {
      successCount,
      failedCount,
      errors
    };
  },

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

      if (existing.user) {
        // Update existing user roles
        if (dto.roles && dto.roles.length > 0) {
          const roles = await tx.role.findMany({ where: { name: { in: dto.roles } } });
          await tx.userRole.deleteMany({ where: { user_id: existing.user.id } });
          await tx.userRole.createMany({
            data: roles.map((r) => ({ user_id: existing.user!.id, role_id: r.id })),
          });
        }

        // Update existing user credentials/info
        const updateUserData: any = {};
        if (dto.username && dto.username !== existing.user.username) {
          const existUsername = await tx.user.findUnique({ where: { username: dto.username } });
          if (existUsername) throw new HttpError('Username sudah digunakan', 409);
          updateUserData.username = dto.username;
        }
        if (dto.password) {
          updateUserData.password = await hashPassword(dto.password);
        }
        if (dto.name) updateUserData.name = dto.name;
        if (dto.email !== undefined) updateUserData.email = dto.email;

        if (Object.keys(updateUserData).length > 0) {
          await tx.user.update({
            where: { id: existing.user.id },
            data: updateUserData
          });
        }
      } else if (dto.username) {
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
