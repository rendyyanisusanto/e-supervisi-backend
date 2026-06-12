import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { CreatePeriodDto, UpdatePeriodDto } from './period.validation';

const serializePeriod = (p: any) => ({
  id: Number(p.id).toString(),
  name: p.name,
  start_date: p.start_date?.toISOString().split('T')[0],
  end_date: p.end_date?.toISOString().split('T')[0],
  is_active: p.is_active,
  created_at: p.created_at?.toISOString(),
  updated_at: p.updated_at?.toISOString(),
});

export const periodService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = (req.query.search as string) || '';

    const where = search
      ? { name: { contains: search } }
      : {};

    const [data, total] = await Promise.all([
      prisma.period.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.period.count({ where }),
    ]);

    return { data: data.map(serializePeriod), meta: buildMeta(total, page, limit) };
  },

  async getActive() {
    const period = await prisma.period.findFirst({ where: { is_active: true } });
    if (!period) throw new HttpError('Tidak ada periode aktif', 404);
    return serializePeriod(period);
  },

  async getById(id: string) {
    const period = await prisma.period.findUnique({ where: { id: BigInt(id) } });
    if (!period) throw new HttpError('Periode tidak ditemukan', 404);
    return serializePeriod(period);
  },

  async create(dto: CreatePeriodDto) {
    if (dto.is_active) {
      await prisma.period.updateMany({ data: { is_active: false } });
    }
    const period = await prisma.period.create({
      data: {
        name: dto.name,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        is_active: dto.is_active ?? false,
      },
    });
    return serializePeriod(period);
  },

  async update(id: string, dto: UpdatePeriodDto) {
    await this.getById(id);
    if (dto.is_active) {
      await prisma.period.updateMany({ where: { id: { not: BigInt(id) } }, data: { is_active: false } });
    }
    const period = await prisma.period.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
    return serializePeriod(period);
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.period.delete({ where: { id: BigInt(id) } });
  },

  async activate(id: string) {
    await this.getById(id);
    await prisma.period.updateMany({ data: { is_active: false } });
    const period = await prisma.period.update({
      where: { id: BigInt(id) },
      data: { is_active: true },
    });
    return serializePeriod(period);
  },
};
