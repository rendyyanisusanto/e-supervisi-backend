import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { CreateInstrumentDto, UpdateInstrumentDto, CreateInstrumentItemDto, UpdateInstrumentItemDto, ReorderItemsDto } from './instrument.validation';
import { InstrumentType } from '@prisma/client';

const serializeItem = (item: any) => ({
  id: Number(item.id).toString(),
  instrument_id: Number(item.instrument_id).toString(),
  category: item.category,
  code: item.code,
  description: item.description,
  max_score: item.max_score,
  sort_order: item.sort_order,
  is_active: item.is_active,
  created_at: item.created_at?.toISOString(),
  updated_at: item.updated_at?.toISOString(),
});

const serialize = (i: any) => ({
  id: Number(i.id).toString(),
  code: i.code,
  name: i.name,
  type: i.type,
  description: i.description,
  is_active: i.is_active,
  items_count: i.items?.length ?? 0,
  items: i.items?.map(serializeItem) ?? undefined,
  created_at: i.created_at?.toISOString(),
  updated_at: i.updated_at?.toISOString(),
});

export const instrumentService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = (req.query.search as string) || '';
    const type = req.query.type as string;
    const isActive = req.query.is_active;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    if (type) where.type = type;
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.instrument.findMany({ 
        where, 
        skip, 
        take: limit, 
        orderBy: { code: 'asc' }, 
        include: { items: { orderBy: { sort_order: 'asc' } } } 
      }),
      prisma.instrument.count({ where }),
    ]);

    return {
      data: data.map(serialize),
      meta: buildMeta(total, page, limit),
    };
  },

  async getById(id: string) {
    const instrument = await prisma.instrument.findUnique({
      where: { id: BigInt(id) },
      include: { items: { where: { is_active: true }, orderBy: { sort_order: 'asc' } } },
    });
    if (!instrument) throw new HttpError('Instrumen tidak ditemukan', 404);
    return serialize(instrument);
  },

  async create(dto: CreateInstrumentDto) {
    const exists = await prisma.instrument.findUnique({ where: { code: dto.code } });
    if (exists) throw new HttpError('Kode instrumen sudah digunakan', 409);
    const instrument = await prisma.instrument.create({ data: { ...dto, type: dto.type as InstrumentType } });
    return serialize(instrument);
  },

  async update(id: string, dto: UpdateInstrumentDto) {
    await this.getById(id);
    if (dto.code) {
      const exists = await prisma.instrument.findFirst({ where: { code: dto.code, id: { not: BigInt(id) } } });
      if (exists) throw new HttpError('Kode instrumen sudah digunakan', 409);
    }
    const instrument = await prisma.instrument.update({ where: { id: BigInt(id) }, data: { ...dto, type: dto.type as InstrumentType | undefined } });
    return serialize(instrument);
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.instrument.delete({ where: { id: BigInt(id) } });
  },

  async toggleStatus(id: string) {
    const instrument = await prisma.instrument.findUnique({ where: { id: BigInt(id) } });
    if (!instrument) throw new HttpError('Instrumen tidak ditemukan', 404);
    return serialize(await prisma.instrument.update({ where: { id: BigInt(id) }, data: { is_active: !instrument.is_active } }));
  },

  async duplicate(id: string) {
    const instrument = await prisma.instrument.findUnique({ where: { id: BigInt(id) }, include: { items: true } });
    if (!instrument) throw new HttpError('Instrumen tidak ditemukan', 404);

    const newCode = `${instrument.code}-COPY-${Date.now()}`;
    const newInstrument = await prisma.$transaction(async (tx) => {
      const created = await tx.instrument.create({
        data: {
          code: newCode,
          name: `${instrument.name} (Copy)`,
          type: instrument.type,
          description: instrument.description,
          is_active: false,
        },
      });

      if (instrument.items.length > 0) {
        await tx.instrumentItem.createMany({
          data: instrument.items.map((item) => ({
            instrument_id: created.id,
            category: item.category,
            code: item.code,
            description: item.description,
            max_score: item.max_score,
            sort_order: item.sort_order,
            is_active: item.is_active,
          })),
        });
      }

      return tx.instrument.findUnique({ where: { id: created.id }, include: { items: { orderBy: { sort_order: 'asc' } } } });
    });
    return serialize(newInstrument);
  },

  // Items
  async getItems(instrumentId: string) {
    await this.getById(instrumentId);
    const items = await prisma.instrumentItem.findMany({
      where: { instrument_id: BigInt(instrumentId) },
      orderBy: { sort_order: 'asc' },
    });
    return items.map(serializeItem);
  },

  async createItem(instrumentId: string, dto: CreateInstrumentItemDto) {
    await this.getById(instrumentId);
    const exists = await prisma.instrumentItem.findFirst({ where: { instrument_id: BigInt(instrumentId), code: dto.code } });
    if (exists) throw new HttpError('Kode item sudah digunakan', 409);
    const item = await prisma.instrumentItem.create({ data: { ...dto, instrument_id: BigInt(instrumentId) } });
    return serializeItem(item);
  },

  async updateItem(instrumentId: string, itemId: string, dto: UpdateInstrumentItemDto) {
    const item = await prisma.instrumentItem.findFirst({ where: { id: BigInt(itemId), instrument_id: BigInt(instrumentId) } });
    if (!item) throw new HttpError('Item instrumen tidak ditemukan', 404);
    const updated = await prisma.instrumentItem.update({ where: { id: BigInt(itemId) }, data: dto });
    return serializeItem(updated);
  },

  async deleteItem(instrumentId: string, itemId: string) {
    const item = await prisma.instrumentItem.findFirst({ where: { id: BigInt(itemId), instrument_id: BigInt(instrumentId) } });
    if (!item) throw new HttpError('Item instrumen tidak ditemukan', 404);
    await prisma.instrumentItem.delete({ where: { id: BigInt(itemId) } });
  },

  async reorderItems(instrumentId: string, dto: ReorderItemsDto) {
    await this.getById(instrumentId);
    await Promise.all(dto.items.map((item) =>
      prisma.instrumentItem.update({ where: { id: BigInt(item.id) }, data: { sort_order: item.sort_order } })
    ));
  },
};
