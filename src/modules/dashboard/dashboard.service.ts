import prisma from '../../config/database';

export const dashboardService = {
  async getDashboardData(userRole: string, teacherIdFromToken?: string) {
    const isGuru = userRole === 'guru';
    const isPenilai = userRole === 'penilai';

    // Base filters
    const teacherFilter = isGuru ? { id: BigInt(teacherIdFromToken!) } : {};
    const supervisionFilter: any = {};
    if (isGuru) {
      supervisionFilter.teacher_id = BigInt(teacherIdFromToken!);
    } else if (isPenilai) {
      supervisionFilter.supervisor_id = BigInt(teacherIdFromToken!);
    }

    // 1. Stats
    const [
      totalTeachers,
      totalSupervisions,
      completedSupervisions,
      scheduledSupervisions
    ] = await Promise.all([
      prisma.teacher.count({ where: teacherFilter }),
      prisma.supervision.count({ where: supervisionFilter }),
      prisma.supervision.count({ where: { ...supervisionFilter, status: 'SELESAI' } }),
      prisma.supervision.count({ where: { ...supervisionFilter, status: 'TERJADWAL' } })
    ]);

    // Average Score
    const scoreAgg = await prisma.supervision.aggregate({
      _avg: { final_score: true },
      where: { ...supervisionFilter, status: 'SELESAI' }
    });
    const averageScore = scoreAgg._avg.final_score ? Number(scoreAgg._avg.final_score).toFixed(1) : 0;

    // Attention Teachers (Teachers with finalStatus 'Perlu Pembinaan' or 'Kurang')
    const badSupervisions = await prisma.supervision.findMany({
      where: {
        ...supervisionFilter,
        status: 'SELESAI',
        final_status: { in: ['Perlu Pembinaan', 'Kurang'] }
      },
      include: { teacher: { include: { mainSubject: true } } },
      distinct: ['teacher_id'],
      take: 5,
      orderBy: { final_score: 'asc' }
    });
    const attentionTeachers = badSupervisions.map(s => ({
      name: s.teacher.name,
      mapel: s.teacher.mainSubject?.name || '-',
      score: Number(s.final_score).toFixed(1),
      status: s.final_status
    }));

    // Weak Aspects (From supervision_items of completed supervisions)
    // We group by item_description or item_category.
    // Let's use raw query or Prisma groupby. Since supervision_item is JSON or a separate table?
    // Wait, in schema, supervision_item is a table!
    const itemsGroupAgg = await prisma.supervisionItem.groupBy({
      by: ['item_category', 'item_description'],
      _avg: { score: true },
      _count: { score: true },
      where: {
        supervision: {
          ...supervisionFilter,
          status: 'SELESAI'
        },
        score: { not: null }
      },
      orderBy: {
        _avg: { score: 'asc' }
      },
      take: 5
    });
    const weakAspects = itemsGroupAgg.map(item => ({
      name: item.item_description || item.item_category,
      score: item._avg.score ? Number(item._avg.score).toFixed(2) : '0'
    }));

    // Upcoming Supervisions
    const upcomingRecords = await prisma.supervision.findMany({
      where: { ...supervisionFilter, status: { in: ['TERJADWAL', 'DRAFT'] } },
      include: {
        teacher: true,
        supervisor: true,
        instruments: true
      },
      orderBy: { scheduled_date: 'asc' },
      take: 5
    });
    const upcomingSupervisions = upcomingRecords.map(s => ({
      id: Number(s.id).toString(),
      date: s.scheduled_date ? s.scheduled_date.toISOString() : '-',
      teacher: s.teacher?.name || '-',
      appraiser: s.supervisor?.name || '-',
      instrument: s.instruments?.map(i => i.name).join(', ') || '-',
      status: s.status === 'TERJADWAL' ? 'Terjadwal' : 'Draft'
    }));

    // Chart Data: Status Distribution
    const statusGroups = await prisma.supervision.groupBy({
      by: ['final_status'],
      _count: { id: true },
      where: {
        ...supervisionFilter,
        status: 'SELESAI',
        final_status: { not: null }
      }
    });

    // We want the distribution array to match the labels in frontend:
    // ['Optimal', 'Baik', 'Cukup', 'Perlu Pembinaan', 'Kurang']
    const statusOrder = ['Optimal', 'Baik', 'Cukup', 'Perlu Pembinaan', 'Kurang'];
    const statusDataArray = statusOrder.map(label => {
      const found = statusGroups.find(g => g.final_status === label);
      return found ? found._count.id : 0;
    });

    // Chart Data: Average Score per Instrument
    const completedSupervisionsData = await prisma.supervision.findMany({
      where: {
        ...supervisionFilter,
        status: 'SELESAI'
      },
      include: { instruments: true }
    });

    const instrumentScores: Record<string, { total: number; count: number }> = {};
    completedSupervisionsData.forEach(sup => {
      const score = Number(sup.final_score) || 0;
      sup.instruments.forEach(inst => {
        if (!instrumentScores[inst.name]) {
          instrumentScores[inst.name] = { total: 0, count: 0 };
        }
        instrumentScores[inst.name].total += score;
        instrumentScores[inst.name].count += 1;
      });
    });

    const instLabels = Object.keys(instrumentScores);
    const instData = instLabels.map(name => {
      const { total, count } = instrumentScores[name];
      return Number((total / count).toFixed(1));
    });

    return {
      stats: {
        totalTeachers,
        totalSupervisions,
        completedSupervisions,
        scheduledSupervisions,
        averageScore: Number(averageScore),
        attentionTeachers: attentionTeachers.length // total count for the stat card
      },
      chartData: {
        averageScoreChart: {
          labels: instLabels,
          data: instData
        },
        statusDistributionChart: {
          labels: statusOrder,
          data: statusDataArray
        }
      },
      weakAspects,
      upcomingSupervisions,
      attentionTeachers
    };
  }
};
