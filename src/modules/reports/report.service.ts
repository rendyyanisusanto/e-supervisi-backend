import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { Request } from 'express';

export const reportService = {
  async getBasicSummary(req: Request) {
    const periodId = req.query.period_id ? BigInt(req.query.period_id as string) : undefined;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const where: any = {};
    if (periodId) where.period_id = periodId;
    if (startDate && endDate) {
      where.supervision_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const totalTeachers = await prisma.teacher.count({ where: { is_active: true } });
    
    // Total supervisors: distinct supervisors from supervisions or user roles, let's use user roles or supervisions
    const supervisionsQuery = await prisma.supervision.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, photo: true } },
        supervisor: { select: { id: true, name: true } },
        reflection: true
      },
      orderBy: { supervision_date: 'desc' }
    });

    const supervisors = new Set(supervisionsQuery.map(s => s.supervisor_id?.toString()).filter(id => id));
    
    const totalInstruments = await prisma.instrument.count({ where: { is_active: true } });

    const totalSupervisions = supervisionsQuery.length;
    const completedSupervisions = supervisionsQuery.filter(s => s.status === 'SELESAI');
    const totalCompleted = completedSupervisions.length;

    let sumScore = 0;
    let totalReflectionsFilled = 0;
    let totalReflectionsPending = 0;

    const teacherScores = new Map<string, { id: string, name: string, photo: string, sum: number, count: number }>();

    completedSupervisions.forEach(s => {
      const finalScore = Number(s.final_score);
      sumScore += finalScore;

      const teacherIdStr = s.teacher_id.toString();
      if (!teacherScores.has(teacherIdStr)) {
        teacherScores.set(teacherIdStr, { id: teacherIdStr, name: s.teacher.name, photo: s.teacher.photo || '', sum: 0, count: 0 });
      }
      const ts = teacherScores.get(teacherIdStr)!;
      ts.sum += finalScore;
      ts.count++;

      if (s.reflection && s.reflection.status !== 'BELUM_DIISI') {
        totalReflectionsFilled++;
      } else {
        totalReflectionsPending++;
      }
    });

    const averageScore = totalCompleted > 0 ? Number((sumScore / totalCompleted).toFixed(2)) : 0;

    const teacherScoreList = Array.from(teacherScores.values()).map(t => ({
      id: t.id,
      name: t.name,
      photo: t.photo,
      average_score: Number((t.sum / t.count).toFixed(2))
    }));

    teacherScoreList.sort((a, b) => b.average_score - a.average_score);

    const topTeachers = teacherScoreList.slice(0, 5);
    const lowTeachers = [...teacherScoreList].sort((a, b) => a.average_score - b.average_score).slice(0, 5).filter(t => t.average_score < 80);

    const all_supervisions = supervisionsQuery.map(s => ({
      id: s.id.toString(),
      teacher_name: s.teacher.name,
      supervisor_name: s.supervisor?.name || '-',
      supervision_date: s.supervision_date?.toISOString().split('T')[0] || null,
      final_score: Number(s.final_score),
      kriteria: s.final_status || '-',
      status: s.status
    }));

    const monthlyMap: Record<string, any> = {};
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    supervisionsQuery.forEach(s => {
      if (!s.supervision_date) return;
      const d = s.supervision_date;
      const monthIndex = d.getMonth();
      const monthName = months[monthIndex];
      const year = d.getFullYear();
      const key = `${monthName} ${year}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: monthName,
          monthIndex: monthIndex,
          year: year,
          total: 0,
          completed: 0,
          scheduled: 0,
          draft: 0,
          sumScore: 0,
          sangatBaik: 0,
          baik: 0,
          cukup: 0,
          kurang: 0
        };
      }
      
      const m = monthlyMap[key];
      m.total++;
      if (s.status === 'SELESAI') {
        m.completed++;
        const score = Number(s.final_score);
        m.sumScore += score;
        if (score >= 91) m.sangatBaik++;
        else if (score >= 81) m.baik++;
        else if (score >= 71) m.cukup++;
        else m.kurang++;
      } else if (s.status === 'TERJADWAL') {
        m.scheduled++;
      } else if (s.status === 'DRAFT' || s.status === 'BELUM_TERLAKSANA') {
        m.draft++;
      }
    });

    const monthly_recap = Object.values(monthlyMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    }).map(m => ({
      month: m.month,
      total_supervisions: m.total,
      completed: m.completed,
      scheduled: m.scheduled,
      draft: m.draft,
      average_score: m.completed > 0 ? Number((m.sumScore / m.completed).toFixed(2)) : 0,
      sangat_baik: m.sangatBaik,
      baik: m.baik,
      cukup: m.cukup,
      kurang: m.kurang
    }));

    // weak categories
    const supervisionIds = completedSupervisions.map(s => s.id);
    const items = await prisma.supervisionItem.findMany({
      where: { supervision_id: { in: supervisionIds } }
    });

    const categoryMap: Record<string, { total: number, max: number }> = {};
    items.forEach(item => {
      if (!categoryMap[item.item_category]) categoryMap[item.item_category] = { total: 0, max: 0 };
      categoryMap[item.item_category].total += (item.score || 0);
      categoryMap[item.item_category].max += item.max_score;
    });

    const weak_categories = Object.keys(categoryMap).map(cat => ({
      category: cat,
      average_score: categoryMap[cat].max > 0 ? Number(((categoryMap[cat].total / categoryMap[cat].max) * 100).toFixed(2)) : 0
    })).filter(c => c.average_score < 80).sort((a, b) => a.average_score - b.average_score);

    return {
      summary: {
        total_teachers: totalTeachers,
        total_supervisors: supervisors.size,
        total_instruments: totalInstruments,
        total_supervisions: totalSupervisions,
        total_completed: totalCompleted,
        average_score: averageScore,
        total_reflections_filled: totalReflectionsFilled,
        total_reflections_pending: totalReflectionsPending
      },
      supervisions: all_supervisions,
      monthly_recap: monthly_recap,
      top_teachers: topTeachers,
      low_teachers: lowTeachers,
      weak_categories: weak_categories
    };
  },

  async getSupervisionRecap(req: Request) {
    const periodId = req.query.period_id ? BigInt(req.query.period_id as string) : undefined;
    const teacherId = req.query.teacher_id ? BigInt(req.query.teacher_id as string) : undefined;
    const supervisorId = req.query.supervisor_id ? BigInt(req.query.supervisor_id as string) : undefined;
    const instrumentId = req.query.instrument_id ? BigInt(req.query.instrument_id as string) : undefined;
    const subjectId = req.query.subject_id ? BigInt(req.query.subject_id as string) : undefined;
    const classroomId = req.query.classroom_id ? BigInt(req.query.classroom_id as string) : undefined;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (periodId) where.period_id = periodId;
    if (teacherId) where.teacher_id = teacherId;
    if (supervisorId) where.supervisor_id = supervisorId;
    if (subjectId) where.subject_id = subjectId;
    if (classroomId) where.classroom_id = classroomId;
    if (status) where.status = status;

    if (req.query.start_date && req.query.end_date) {
      where.supervision_date = {
        gte: new Date(req.query.start_date as string),
        lte: new Date(req.query.end_date as string)
      };
    }

    if (instrumentId) {
      where.instruments = {
        some: { id: instrumentId }
      };
    }

    if (search) {
      where.OR = [
        { teacher: { name: { contains: search } } },
        { supervisor: { name: { contains: search } } }
      ];
    }

    // First fetch all for summary without pagination
    const allSupervisions = await prisma.supervision.findMany({
      where,
      include: { instruments: true, reflection: true, supervisor: { select: { id: true, name: true } }, teacher: { select: { id: true } } }
    });
    
    // Total teachers for coverage
    const totalTeachers = await prisma.teacher.count({
      where: { is_active: true }
    });

    const total = allSupervisions.length;
    const totalCompleted = allSupervisions.filter(s => s.status === 'SELESAI').length;
    let sumScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    if (totalCompleted === 0) lowestScore = 0;

    const statusMap: Record<string, number> = { 'SELESAI': 0, 'TERJADWAL': 0, 'DRAFT': 0, 'DIBATALKAN': 0 };
    const instMap: Record<string, { id: string, name: string, total: number, score: number, count: number }> = {};
    const supMap: Record<string, { id: string, name: string, total: number, score: number, count: number }> = {};
    const supervisedTeacherIds = new Set<string>();

    allSupervisions.forEach(s => {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
      
      if (s.status === 'SELESAI') {
        const score = Number(s.final_score);
        sumScore += score;
        if (score > highestScore) highestScore = score;
        if (score < lowestScore) lowestScore = score;
        
        s.instruments.forEach(inst => {
          const iId = inst.id.toString();
          if (!instMap[iId]) instMap[iId] = { id: iId, name: inst.name, total: 0, score: 0, count: 0 };
          instMap[iId].total += 1;
          instMap[iId].score += score;
          instMap[iId].count += 1;
        });

        if (s.supervisor) {
          const sId = s.supervisor.id.toString();
          if (!supMap[sId]) supMap[sId] = { id: sId, name: s.supervisor.name, total: 0, score: 0, count: 0 };
          supMap[sId].total += 1;
          supMap[sId].score += score;
          supMap[sId].count += 1;
        }

        if (s.teacher) {
          supervisedTeacherIds.add(s.teacher.id.toString());
        }
      } else {
        s.instruments.forEach(inst => {
          const iId = inst.id.toString();
          if (!instMap[iId]) instMap[iId] = { id: iId, name: inst.name, total: 0, score: 0, count: 0 };
          instMap[iId].total += 1;
        });

        if (s.supervisor) {
          const sId = s.supervisor.id.toString();
          if (!supMap[sId]) supMap[sId] = { id: sId, name: s.supervisor.name, total: 0, score: 0, count: 0 };
          supMap[sId].total += 1;
        }
      }
    });

    const data = await prisma.supervision.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: { select: { name: true, nip: true } },
        supervisor: { select: { name: true } },
        instruments: { select: { id: true, name: true } },
        subject: { select: { name: true } },
        reflection: true
      },
      orderBy: { supervision_date: 'desc' }
    });

    return {
      summary: {
        total_supervisions: total,
        total_completed: totalCompleted,
        total_scheduled: statusMap['TERJADWAL'] || 0,
        total_draft: statusMap['DRAFT'] || 0,
        total_cancelled: statusMap['DIBATALKAN'] || 0,
        average_score: totalCompleted > 0 ? Number((sumScore / totalCompleted).toFixed(2)) : 0,
        highest_score: highestScore,
        lowest_score: lowestScore
      },
      by_status: Object.keys(statusMap).map(st => ({ status: st, total: statusMap[st] })),
      by_instrument: Object.values(instMap).map(i => ({
        instrument_id: i.id,
        instrument_name: i.name,
        total: i.total,
        average_score: i.count > 0 ? Number((i.score / i.count).toFixed(2)) : 0
      })),
      by_supervisor: Object.values(supMap).map(s => ({
        supervisor_id: s.id,
        supervisor_name: s.name,
        total: s.total,
        average_score: s.count > 0 ? Number((s.score / s.count).toFixed(2)) : 0
      })),
      teacher_coverage: {
        total: totalTeachers,
        supervised: supervisedTeacherIds.size,
        unsupervised: Math.max(0, totalTeachers - supervisedTeacherIds.size)
      },
      data: data.map((s: any) => ({
        id: Number(s.id).toString(),
        teacher_id: Number(s.teacher_id).toString(),
        teacher_name: s.teacher.name,
        teacher_nip: s.teacher.nip,
        supervisor_name: s.supervisor?.name || '-',
        instrument_name: s.instruments && s.instruments.length > 0 ? s.instruments.map((i: any) => i.name).join(', ') : '-',
        subject_name: s.subject?.name || '-',
        supervision_date: s.supervision_date?.toISOString().split('T')[0] || null,
        final_score: Number(s.final_score),
        final_status: s.final_status,
        status: s.status,
        reflection_status: s.reflection?.status || 'BELUM_DIISI'
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getTeacherReport(teacherIdStr: string, periodIdStr: string) {
    // ... existing implementation ...
    const teacherId = BigInt(teacherIdStr);
    const periodId = BigInt(periodIdStr);

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new HttpError('Guru tidak ditemukan', 404);

    const period = await prisma.period.findUnique({ where: { id: periodId } });

    const supervisions = await prisma.supervision.findMany({
      where: { teacher_id: teacherId, period_id: periodId },
      include: {
        supervisor: { select: { name: true } },
        instruments: { select: { name: true } }
      }
    });

    const completed = supervisions.filter(s => s.status === 'SELESAI');
    
    let sumScore = 0;
    let highest = 0;
    let lowest = 100;
    if (completed.length === 0) lowest = 0;

    completed.forEach(s => {
      const score = Number(s.final_score);
      sumScore += score;
      if (score > highest) highest = score;
      if (score < lowest) lowest = score;
    });

    const averageScore = completed.length > 0 ? Number((sumScore / completed.length).toFixed(2)) : 0;
    
    const scoreRanges = await prisma.scoreRange.findMany();
    const finalStatusObj = scoreRanges.find(r => averageScore >= Number(r.min_score) && averageScore <= Number(r.max_score));
    const finalStatus = finalStatusObj ? finalStatusObj.status : '-';

    return {
      teacher: {
        id: Number(teacher.id).toString(),
        name: teacher.name,
        nip: teacher.nip
      },
      period: period ? { id: Number(period.id).toString(), name: period.name } : null,
      summary: {
        total_supervisions: supervisions.length,
        total_completed: completed.length,
        average_score: averageScore,
        highest_score: highest,
        lowest_score: lowest,
        final_status: finalStatus
      },
      supervisions: supervisions.map((s: any) => ({
        id: Number(s.id).toString(),
        supervisor_name: s.supervisor?.name || '-',
        instrument_name: s.instruments && s.instruments.length > 0 ? s.instruments.map((i: any) => i.name).join(', ') : '-',
        supervision_date: s.supervision_date?.toISOString().split('T')[0] || null,
        final_score: Number(s.final_score),
        final_status: s.final_status,
        status: s.status
      }))
    };
  },

  async getTeacherCompetency(teacherIdStr: string, periodIdStr: string) {
    const teacherId = BigInt(teacherIdStr);
    const periodId = BigInt(periodIdStr);

    const supervisions = await prisma.supervision.findMany({
      where: { teacher_id: teacherId, period_id: periodId, status: 'SELESAI' },
      include: { items: true }
    });

    const categoryMap: Record<string, { totalScore: number, maxScore: number }> = {};

    supervisions.forEach(s => {
      s.items.forEach(item => {
        if (!categoryMap[item.item_category]) {
          categoryMap[item.item_category] = { totalScore: 0, maxScore: 0 };
        }
        categoryMap[item.item_category].totalScore += (item.score || 0);
        categoryMap[item.item_category].maxScore += item.max_score;
      });
    });

    return Object.keys(categoryMap).map(category => {
      const { totalScore, maxScore } = categoryMap[category];
      const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      return {
        category,
        total_score: totalScore,
        max_score: maxScore,
        final_score: Number(finalScore.toFixed(2)),
        status: finalScore >= 80 ? 'Baik' : (finalScore >= 60 ? 'Cukup' : 'Kurang')
      };
    });
  },

  async getWeaknessMap(req: Request) {
    const periodId = req.query.period_id ? BigInt(req.query.period_id as string) : undefined;
    const instrumentId = req.query.instrument_id ? BigInt(req.query.instrument_id as string) : undefined;
    const teacherId = req.query.teacher_id ? BigInt(req.query.teacher_id as string) : undefined;
    const subjectId = req.query.subject_id ? BigInt(req.query.subject_id as string) : undefined;
    const classroomId = req.query.classroom_id ? BigInt(req.query.classroom_id as string) : undefined;

    const where: any = { status: 'SELESAI' };
    if (periodId) where.period_id = periodId;
    if (teacherId) where.teacher_id = teacherId;
    if (subjectId) where.subject_id = subjectId;
    if (classroomId) where.classroom_id = classroomId;

    if (req.query.start_date && req.query.end_date) {
      where.supervision_date = {
        gte: new Date(req.query.start_date as string),
        lte: new Date(req.query.end_date as string)
      };
    }

    if (instrumentId) {
      where.instruments = {
        some: { id: instrumentId }
      };
    }

    const supervisions = await prisma.supervision.findMany({
      where,
      include: { 
        items: true,
        teacher: { select: { id: true, name: true } },
        subject: { select: { name: true } }
      }
    });

    const categoryMap: Record<string, { totalScore: number, maxScore: number, itemsCount: number, lowItems: number, teachers: Set<string> }> = {};
    const itemMap: Record<string, { desc: string, category: string, score: number, max: number, lowCount: number, teachers: Set<string> }> = {};
    const teacherMap: Record<string, { id: string, name: string, subject: string, scoreSum: number, count: number, weakAspects: Set<string>, weakItems: number }> = {};

    let totalScoreAll = 0;

    supervisions.forEach(s => {
      totalScoreAll += Number(s.final_score);
      const tId = s.teacher.id.toString();
      if (!teacherMap[tId]) {
        teacherMap[tId] = { id: tId, name: s.teacher.name, subject: s.subject?.name || '-', scoreSum: 0, count: 0, weakAspects: new Set(), weakItems: 0 };
      }
      teacherMap[tId].scoreSum += Number(s.final_score);
      teacherMap[tId].count += 1;

      s.items.forEach(item => {
        // Category
        if (!categoryMap[item.item_category]) {
          categoryMap[item.item_category] = { totalScore: 0, maxScore: 0, itemsCount: 0, lowItems: 0, teachers: new Set() };
        }
        categoryMap[item.item_category].totalScore += (item.score || 0);
        categoryMap[item.item_category].maxScore += item.max_score;
        categoryMap[item.item_category].itemsCount += 1;

        // Item
        const key = item.item_code;
        if (!itemMap[key]) {
          itemMap[key] = { desc: item.item_description, category: item.item_category, score: 0, max: 0, lowCount: 0, teachers: new Set() };
        }
        itemMap[key].score += (item.score || 0);
        itemMap[key].max += item.max_score;

        if (item.max_score > 0) {
          const pct = ((item.score || 0) / item.max_score) * 100;
          if (pct < 75) {
            categoryMap[item.item_category].lowItems += 1;
            categoryMap[item.item_category].teachers.add(tId);
            itemMap[key].lowCount += 1;
            itemMap[key].teachers.add(tId);
            teacherMap[tId].weakItems += 1;
          }
        }
      });
    });

    const weak_aspects = Object.keys(categoryMap)
      .map(cat => ({
        category: cat,
        average_score: categoryMap[cat].maxScore > 0 ? Number(((categoryMap[cat].totalScore / categoryMap[cat].maxScore) * 100).toFixed(2)) : 0,
        total_items: categoryMap[cat].itemsCount,
        total_low_items: categoryMap[cat].lowItems,
        affected_teachers: categoryMap[cat].teachers.size,
        status: 'Perlu Pembinaan'
      }))
      .filter(c => c.average_score < 80);

    const weak_items = Object.keys(itemMap)
      .map(code => {
        const pct = itemMap[code].max > 0 ? (itemMap[code].score / itemMap[code].max) * 100 : 0;
        return {
          item_code: code,
          item_description: itemMap[code].desc,
          category: itemMap[code].category,
          average_score: Number((itemMap[code].score / (itemMap[code].max / 4)).toFixed(2)), // Assuming max_score per item is 4 for average
          average_percentage: Number(pct.toFixed(2)),
          max_score: 4,
          low_count: itemMap[code].lowCount,
          affected_teachers: itemMap[code].teachers.size
        };
      })
      .filter(i => i.average_percentage < 75);

    // Update weak aspects for teachers
    weak_aspects.forEach(wa => {
      categoryMap[wa.category].teachers.forEach(tId => {
        teacherMap[tId].weakAspects.add(wa.category);
      });
    });

    const attention_teachers = Object.values(teacherMap).map(t => {
      const avg = t.count > 0 ? t.scoreSum / t.count : 0;
      return {
        teacher_id: t.id,
        teacher_name: t.name,
        subject: t.subject,
        average_score: Number(avg.toFixed(2)),
        weak_aspects: Array.from(t.weakAspects),
        weak_item_count: t.weakItems
      };
    }).filter(t => t.average_score < 80 || t.weak_item_count > 3);

    const weakestAspect = weak_aspects.sort((a, b) => a.average_score - b.average_score)[0]?.category || '-';

    return {
      summary: {
        total_supervisions: supervisions.length,
        average_score: supervisions.length > 0 ? Number((totalScoreAll / supervisions.length).toFixed(2)) : 0,
        total_weak_aspects: weak_aspects.length,
        total_weak_items: weak_items.length,
        total_attention_teachers: attention_teachers.length,
        weakest_aspect: weakestAspect
      },
      weak_aspects,
      weak_items,
      attention_teachers
    };
  },

  async getIndicatorReport(req: Request) {
    const periodId = req.query.period_id ? BigInt(req.query.period_id as string) : undefined;
    const instrumentId = req.query.instrument_id ? BigInt(req.query.instrument_id as string) : undefined;
    const category = req.query.category as string;
    const teacherId = req.query.teacher_id ? BigInt(req.query.teacher_id as string) : undefined;
    const supervisorId = req.query.supervisor_id ? BigInt(req.query.supervisor_id as string) : undefined;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const where: any = { status: 'SELESAI' };
    if (periodId) where.period_id = periodId;
    if (teacherId) where.teacher_id = teacherId;
    if (supervisorId) where.supervisor_id = supervisorId;
    if (req.query.start_date && req.query.end_date) {
      where.supervision_date = {
        gte: new Date(req.query.start_date as string),
        lte: new Date(req.query.end_date as string)
      };
    }
    if (instrumentId) {
      where.instruments = {
        some: { id: instrumentId }
      };
    }

    const supervisions = await prisma.supervision.findMany({
      where,
      include: { items: true }
    });

    const itemMap: Record<string, { desc: string, category: string, score: number, max: number, assessed: number, low: number }> = {};
    let totalScoreSum = 0;
    let totalMaxSum = 0;

    supervisions.forEach(s => {
      s.items.forEach(item => {
        if (category && item.item_category !== category) return;

        const key = item.item_code;
        if (!itemMap[key]) {
          itemMap[key] = { desc: item.item_description, category: item.item_category, score: 0, max: 0, assessed: 0, low: 0 };
        }
        itemMap[key].score += (item.score || 0);
        itemMap[key].max += item.max_score;
        itemMap[key].assessed += 1;
        totalScoreSum += (item.score || 0);
        totalMaxSum += item.max_score;

        if (item.max_score > 0) {
          const pct = ((item.score || 0) / item.max_score) * 100;
          if (pct < 75) {
            itemMap[key].low += 1;
          }
        }
      });
    });

    let allItemsList = Object.keys(itemMap).map(code => {
      const pct = itemMap[code].max > 0 ? (itemMap[code].score / itemMap[code].max) * 100 : 0;
      return {
        item_code: code,
        item_description: itemMap[code].desc,
        category: itemMap[code].category,
        max_score: 4,
        average_score: Number((itemMap[code].score / itemMap[code].assessed).toFixed(2)),
        average_percentage: Number(pct.toFixed(2)),
        total_assessed: itemMap[code].assessed,
        low_count: itemMap[code].low,
        status: pct >= 80 ? 'Sangat Baik' : (pct >= 75 ? 'Baik' : 'Perlu Pembinaan')
      };
    });

    // Categories summary
    const catMap: Record<string, { score: number, max: number, count: number }> = {};
    allItemsList.forEach(i => {
      if (!catMap[i.category]) catMap[i.category] = { score: 0, max: 0, count: 0 };
      catMap[i.category].score += itemMap[i.item_code].score;
      catMap[i.category].max += itemMap[i.item_code].max;
      catMap[i.category].count += 1;
    });

    const categories = Object.keys(catMap).map(c => ({
      category: c,
      average_percentage: catMap[c].max > 0 ? Number(((catMap[c].score / catMap[c].max) * 100).toFixed(2)) : 0,
      total_indicators: catMap[c].count
    }));

    // Sorting and Pagination
    allItemsList.sort((a, b) => a.item_code.localeCompare(b.item_code));
    
    const highest_indicator = [...allItemsList].sort((a, b) => b.average_percentage - a.average_percentage)[0]?.item_code || '-';
    const lowest_indicator = [...allItemsList].sort((a, b) => a.average_percentage - b.average_percentage)[0]?.item_code || '-';

    const total = allItemsList.length;
    const skip = (page - 1) * limit;
    const paginatedData = allItemsList.slice(skip, skip + limit);

    return {
      summary: {
        total_indicators: total,
        average_percentage: totalMaxSum > 0 ? Number(((totalScoreSum / totalMaxSum) * 100).toFixed(2)) : 0,
        highest_indicator,
        lowest_indicator
      },
      categories,
      data: paginatedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
