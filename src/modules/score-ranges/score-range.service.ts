import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { CreateScoreRangeDto, UpdateScoreRangeDto } from './score-range.validation';

const serialize = (s: any) => ({
  id: Number(s.id).toString(),
  min_score: parseFloat(s.min_score.toString()),
  max_score: parseFloat(s.max_score.toString()),
  status: s.status,
  color: s.color,
  description: s.description,
  created_at: s.created_at?.toISOString(),
  updated_at: s.updated_at?.toISOString(),
});

const checkOverlap = async (min: number, max: number, excludeId?: bigint) => {
  const existing = await prisma.scoreRange.findMany({
    where: excludeId ? { id: { not: excludeId } } : {},
  });

  for (const range of existing) {
    const existMin = parseFloat(range.min_score.toString());
    const existMax = parseFloat(range.max_score.toString());
    // Overlap check: new range overlaps if min < existMax && max > existMin
    if (min < existMax && max > existMin) {
      throw new HttpError(`Rentang nilai overlap dengan ${range.status} (${existMin}-${existMax})`, 409);
    }
  }
};

export const scoreRangeService = {
  async getAll() {
    const data = await prisma.scoreRange.findMany({ orderBy: { min_score: 'desc' } });
    return data.map(serialize);
  },

  async getById(id: string) {
    const range = await prisma.scoreRange.findUnique({ where: { id: BigInt(id) } });
    if (!range) throw new HttpError('Rentang nilai tidak ditemukan', 404);
    return serialize(range);
  },

  async create(dto: CreateScoreRangeDto) {
    await checkOverlap(dto.min_score, dto.max_score);
    const range = await prisma.scoreRange.create({
      data: {
        min_score: dto.min_score,
        max_score: dto.max_score,
        status: dto.status,
        color: dto.color ?? null,
        description: dto.description ?? null,
      },
    });
    return serialize(range);
  },

  async update(id: string, dto: UpdateScoreRangeDto) {
    const existing = await this.getById(id);
    const min = dto.min_score ?? existing.min_score;
    const max = dto.max_score ?? existing.max_score;
    await checkOverlap(min as number, max as number, BigInt(id));
    const range = await prisma.scoreRange.update({ where: { id: BigInt(id) }, data: dto });
    return serialize(range);
  },

  async delete(id: string) {
    await this.getById(id);
    await prisma.scoreRange.delete({ where: { id: BigInt(id) } });
  },
};
