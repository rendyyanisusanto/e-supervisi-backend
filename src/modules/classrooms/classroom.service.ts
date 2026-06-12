import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { CreateClassroomDto, UpdateClassroomDto } from './classroom.validation';

const serialize = (c: any) => ({
  id: Number(c.id).toString(),
  name: c.name,
  grade: c.grade,
  major: c.major,
  homeroom_teacher_id: c.homeroom_teacher_id ? Number(c.homeroom_teacher_id).toString() : null,
  homeroom_teacher: c.homeroomTeacher ? { id: Number(c.homeroomTeacher.id).toString(), name: c.homeroomTeacher.name } : null,
  is_active: c.is_active,
  created_at: c.created_at?.toISOString(),
  updated_at: c.updated_at?.toISOString(),
});

export const classroomService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = (req.query.search as string) || '';
    const isActive = req.query.is_active;
    const grade = req.query.grade as string;

    const where: any = {};
    if (search) where.name = { contains: search };
    if (isActive !== undefined) where.is_active = isActive === 'true';
    if (grade) where.grade = grade;

    const [data, total] = await Promise.all([
      prisma.classroom.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { homeroomTeacher: { select: { id: true, name: true } } } }),
      prisma.classroom.count({ where }),
    ]);
    return { data: data.map(serialize), meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const classroom = await prisma.classroom.findUnique({ where: { id: BigInt(id) }, include: { homeroomTeacher: { select: { id: true, name: true } } } });
    if (!classroom) throw new HttpError('Kelas tidak ditemukan', 404);
    return serialize(classroom);
  },

  async create(dto: CreateClassroomDto) {
    const classroom = await prisma.classroom.create({
      data: {
        name: dto.name,
        grade: dto.grade ?? null,
        major: dto.major ?? null,
        homeroom_teacher_id: dto.homeroom_teacher_id ? BigInt(dto.homeroom_teacher_id) : null,
        is_active: dto.is_active ?? true,
      },
      include: { homeroomTeacher: { select: { id: true, name: true } } },
    });
    return serialize(classroom);
  },

  async update(id: string, dto: UpdateClassroomDto) {
    await this.getById(id);
    const classroom = await prisma.classroom.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.grade !== undefined && { grade: dto.grade }),
        ...(dto.major !== undefined && { major: dto.major }),
        ...(dto.homeroom_teacher_id !== undefined && { homeroom_teacher_id: dto.homeroom_teacher_id ? BigInt(dto.homeroom_teacher_id) : null }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: { homeroomTeacher: { select: { id: true, name: true } } },
    });
    return serialize(classroom);
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.classroom.delete({ where: { id: BigInt(id) } });
  },

  async toggleStatus(id: string) {
    const classroom = await prisma.classroom.findUnique({ where: { id: BigInt(id) } });
    if (!classroom) throw new HttpError('Kelas tidak ditemukan', 404);
    const updated = await prisma.classroom.update({ where: { id: BigInt(id) }, data: { is_active: !classroom.is_active }, include: { homeroomTeacher: { select: { id: true, name: true } } } });
    return serialize(updated);
  },
};
