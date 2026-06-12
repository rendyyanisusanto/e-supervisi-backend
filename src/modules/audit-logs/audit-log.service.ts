import prisma from '../../config/database';

export const auditLogService = {
  async getAll(req: any) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.user_id) where.user_id = BigInt(req.query.user_id);
    if (req.query.action) where.action = req.query.action;
    if (req.query.module) where.module = req.query.module;
    if (req.query.search) {
      where.OR = [
        { description: { contains: req.query.search } },
        { action: { contains: req.query.search } },
        { module: { contains: req.query.search } }
      ];
    }
    if (req.query.start_date && req.query.end_date) {
      where.created_at = {
        gte: new Date(req.query.start_date),
        lte: new Date(req.query.end_date)
      };
    }

    const total = await prisma.auditLog.count({ where });
    const logs = await prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    });

    const userIds = Array.from(new Set(logs.map(l => l.user_id).filter(id => id))) as bigint[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true }
    });
    
    const userMap: Record<string, any> = {};
    users.forEach(u => {
      userMap[u.id.toString()] = { name: u.name, username: u.username };
    });

    return {
      data: logs.map(l => {
        const uid = l.user_id?.toString();
        return {
          id: l.id.toString(),
          user_id: uid || null,
          user_name: uid && userMap[uid] ? userMap[uid].name : '-',
          action: l.action,
          module: l.module,
          description: l.description,
          ip_address: l.ip_address,
          user_agent: l.user_agent,
          created_at: l.created_at.toISOString()
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }
};
