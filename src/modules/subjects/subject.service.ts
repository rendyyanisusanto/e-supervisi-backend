import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.validation';

const serialize = (s: any) => ({
  id: Number(s.id).toString(),
  code: s.code,
  name: s.name,
  group_name: s.group_name,
  is_active: s.is_active,
  created_at: s.created_at?.toISOString(),
  updated_at: s.updated_at?.toISOString(),
});

export const subjectService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = (req.query.search as string) || '';
    const isActive = req.query.is_active;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.subject.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.subject.count({ where }),
    ]);
    return { data: data.map(serialize), meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const subject = await prisma.subject.findUnique({ where: { id: BigInt(id) } });
    if (!subject) throw new HttpError('Mata pelajaran tidak ditemukan', 404);
    return serialize(subject);
  },

  async create(dto: CreateSubjectDto) {
    const exists = await prisma.subject.findUnique({ where: { code: dto.code } });
    if (exists) throw new HttpError('Kode mata pelajaran sudah digunakan', 409);
    const subject = await prisma.subject.create({ data: dto });
    return serialize(subject);
  },

  async update(id: string, dto: UpdateSubjectDto) {
    await this.getById(id);
    if (dto.code) {
      const exists = await prisma.subject.findFirst({ where: { code: dto.code, id: { not: BigInt(id) } } });
      if (exists) throw new HttpError('Kode mata pelajaran sudah digunakan', 409);
    }
    const subject = await prisma.subject.update({ where: { id: BigInt(id) }, data: dto });
    return serialize(subject);
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.subject.delete({ where: { id: BigInt(id) } });
  },

  async toggleStatus(id: string) {
    const subject = await prisma.subject.findUnique({ where: { id: BigInt(id) } });
    if (!subject) throw new HttpError('Mata pelajaran tidak ditemukan', 404);
    const updated = await prisma.subject.update({ where: { id: BigInt(id) }, data: { is_active: !subject.is_active } });
    return serialize(updated);
  },
};
