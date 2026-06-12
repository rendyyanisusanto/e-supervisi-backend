import prisma from '../../config/database';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { HttpError } from '../../common/middlewares/error.middleware';

const serialize = (n: any) => ({
  id: Number(n.id).toString(),
  user_id: n.user_id ? Number(n.user_id).toString() : null,
  title: n.title, message: n.message,
  type: n.type, is_read: n.is_read, link: n.link,
  created_at: n.created_at?.toISOString(),
});

export const notificationService = {
  async getAll(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const userId = req.user?.sub;
    const isRead = req.query.is_read;

    const where: any = {
      OR: [{ user_id: userId ? BigInt(userId) : null }, { user_id: null }],
    };
    if (isRead !== undefined) where.is_read = isRead === 'true';

    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
    return { data: data.map(serialize), meta: buildMeta(total, page, limit) };
  },

  async markRead(id: string, userId: number) {
    const n = await prisma.notification.findUnique({ where: { id: BigInt(id) } });
    if (!n) throw new HttpError('Notifikasi tidak ditemukan', 404);
    const updated = await prisma.notification.update({ where: { id: BigInt(id) }, data: { is_read: true } });
    return serialize(updated);
  },

  async markAllRead(userId: number) {
    await prisma.notification.updateMany({
      where: { OR: [{ user_id: BigInt(userId) }, { user_id: null }], is_read: false },
      data: { is_read: true },
    });
  },
};
