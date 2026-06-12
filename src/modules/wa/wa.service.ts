import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { CreateWaTemplateDto, UpdateWaTemplateDto } from './wa.validation';
import { WaCategory } from '@prisma/client';

const serialize = (t: any) => ({
  id: Number(t.id).toString(),
  code: t.code, name: t.name, description: t.description,
  category: t.category, content: t.content, is_active: t.is_active,
  created_at: t.created_at?.toISOString(), updated_at: t.updated_at?.toISOString(),
});

export const waService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = (req.query.search as string) || '';
    const category = req.query.category as string;
    const isActive = req.query.is_active;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    if (category) where.category = category;
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.waTemplate.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.waTemplate.count({ where }),
    ]);
    return { data: data.map(serialize), meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const t = await prisma.waTemplate.findUnique({ where: { id: BigInt(id) } });
    if (!t) throw new HttpError('Template WA tidak ditemukan', 404);
    return serialize(t);
  },

  async create(dto: CreateWaTemplateDto) {
    const exists = await prisma.waTemplate.findUnique({ where: { code: dto.code } });
    if (exists) throw new HttpError('Kode template sudah digunakan', 409);
    const t = await prisma.waTemplate.create({ data: { ...dto, category: dto.category as WaCategory } });
    return serialize(t);
  },

  async update(id: string, dto: UpdateWaTemplateDto) {
    await this.getById(id);
    if (dto.code) {
      const exists = await prisma.waTemplate.findFirst({ where: { code: dto.code, id: { not: BigInt(id) } } });
      if (exists) throw new HttpError('Kode template sudah digunakan', 409);
    }
    const t = await prisma.waTemplate.update({ where: { id: BigInt(id) }, data: { ...dto, category: dto.category as WaCategory | undefined } });
    return serialize(t);
  },

  async toggleStatus(id: string) {
    const t = await prisma.waTemplate.findUnique({ where: { id: BigInt(id) } });
    if (!t) throw new HttpError('Template WA tidak ditemukan', 404);
    const updated = await prisma.waTemplate.update({ where: { id: BigInt(id) }, data: { is_active: !t.is_active } });
    return serialize(updated);
  },
};
