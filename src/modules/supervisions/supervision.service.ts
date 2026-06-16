import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { CreateSupervisionDto, UpdateScheduleDto, SaveDraftDto, SubmitFinalDto } from './supervision.validation';
import { calculateFinalScore, calculateMaxScore, calculateTotalScore, getItemStatus, getScoreStatus } from '../../common/utils/score';
import { SupervisionStatus, SupervisionType } from '@prisma/client';

const serializeItem = (item: any) => ({
  id: Number(item.id).toString(),
  supervisionId: Number(item.supervision_id).toString(),
  instrumentItemId: Number(item.instrument_item_id).toString(),
  instrumentName: item.instrumentItem?.instrument?.name,
  itemCategory: item.item_category,
  itemCode: item.item_code,
  itemDescription: item.item_description,
  maxScore: item.max_score,
  score: item.score,
  itemStatus: item.item_status,
  note: item.note
});

const serializeSupervision = (s: any) => ({
  id: Number(s.id).toString(),
  periodId: Number(s.period_id).toString(),
  teacherId: Number(s.teacher_id).toString(),
  supervisorId: Number(s.supervisor_id).toString(),
  instrumentIds: s.instruments ? s.instruments.map((i: any) => Number(i.id).toString()) : [],
  subjectId: s.subject_id ? Number(s.subject_id).toString() : null,
  classroomId: s.classroom_id ? Number(s.classroom_id).toString() : null,
  supervisionType: s.supervision_type,
  status: s.status,
  scheduledDate: s.scheduled_date ? s.scheduled_date.toISOString().split('T')[0] : null,
  scheduledTime: s.scheduled_time ? s.scheduled_time.toISOString().split('T')[1].substring(0, 5) : null,
  supervisionDate: s.supervision_date ? s.supervision_date.toISOString().split('T')[0] : null,
  location: s.location,
  initialNote: s.initial_note,
  totalScore: Number(s.total_score),
  maxScore: Number(s.max_score),
  finalScore: Number(s.final_score),
  finalStatus: s.final_status,
  strengthNote: s.strength_note,
  improvementNote: s.improvement_note,
  generalNote: s.general_note,
  recommendationNote: s.recommendation_note,
  conclusionNote: s.conclusion_note,
  submittedAt: s.submitted_at?.toISOString() || null,
  createdAt: s.created_at?.toISOString(),
  updatedAt: s.updated_at?.toISOString(),
  period: s.period ? { id: Number(s.period.id).toString(), name: s.period.name } : undefined,
  teacher: s.teacher ? { id: Number(s.teacher.id).toString(), name: s.teacher.name, nip: s.teacher.nip, photo: s.teacher.photo } : undefined,
  supervisor: s.supervisor ? { id: Number(s.supervisor.id).toString(), name: s.supervisor.name, nip: s.supervisor.nip, photo: s.supervisor.photo } : undefined,
  instruments: s.instruments ? s.instruments.map((i: any) => ({ id: Number(i.id).toString(), name: i.name, code: i.code })) : undefined,
  subject: s.subject ? { id: Number(s.subject.id).toString(), name: s.subject.name } : undefined,
  classroom: s.classroom ? { id: Number(s.classroom.id).toString(), name: s.classroom.name } : undefined,
  items: s.items ? s.items.map(serializeItem) : undefined,
  creator: s.createdBy ? { id: Number(s.createdBy.id).toString(), name: s.createdBy.name } : undefined,
  submitter: s.submittedBy ? { id: Number(s.submittedBy.id).toString(), name: s.submittedBy.name } : undefined,
});

const supervisionIncludes = {
  period: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true, nip: true, photo: true } },
  supervisor: { select: { id: true, name: true, nip: true, photo: true } },
  instruments: { select: { id: true, name: true, code: true } },
  subject: { select: { id: true, name: true } },
  classroom: { select: { id: true, name: true } },
};

export const supervisionService = {
  async getAll(req: Request, userRole: string, userId: string, teacherIdFromToken?: string) {
    const { page, limit, skip } = parsePagination(req);
    const where: any = {};
    
    // Filters
    if (req.query.period_id) where.period_id = BigInt(req.query.period_id as string);
    if (req.query.teacher_id) where.teacher_id = BigInt(req.query.teacher_id as string);
    if (req.query.supervisor_id) where.supervisor_id = BigInt(req.query.supervisor_id as string);
    if (req.query.instrument_id) where.instruments = { some: { id: BigInt(req.query.instrument_id as string) } };
    if (req.query.subject_id) where.subject_id = BigInt(req.query.subject_id as string);
    if (req.query.classroom_id) where.classroom_id = BigInt(req.query.classroom_id as string);
    if (req.query.status) where.status = req.query.status as SupervisionStatus;
    if (req.query.supervision_type) where.supervision_type = req.query.supervision_type as SupervisionType;
    
    // Date filters
    if (req.query.start_date && req.query.end_date) {
      where.OR = [
        { scheduled_date: { gte: new Date(req.query.start_date as string), lte: new Date(req.query.end_date as string) } },
        { supervision_date: { gte: new Date(req.query.start_date as string), lte: new Date(req.query.end_date as string) } }
      ];
    }

    // Role-based access control
    if (userRole === 'guru') {
      // Guru can only see their own supervisions
      where.teacher_id = BigInt(teacherIdFromToken!);
    } else if (userRole === 'penilai') {
      // Penilai can see supervisions where they are the supervisor
      where.supervisor_id = BigInt(teacherIdFromToken!);
    }
    // Admin/Kurikulum can see all

    if (req.query.search) {
      const s = req.query.search as string;
      where.OR = [
        { teacher: { name: { contains: s } } },
        { supervisor: { name: { contains: s } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.supervision.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: supervisionIncludes
      }),
      prisma.supervision.count({ where })
    ]);

    return {
      data: data.map(serializeSupervision),
      meta: buildMeta(total, page, limit)
    };
  },

  async getById(id: string, userRole: string, teacherIdFromToken?: string) {
    const supervision = await prisma.supervision.findUnique({
      where: { id: BigInt(id) },
      include: {
        ...supervisionIncludes,
        items: { 
          orderBy: { instrumentItem: { sort_order: 'asc' } },
          include: { instrumentItem: { include: { instrument: { select: { name: true } } } } }
        },
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        reflection: true
      }
    });

    if (!supervision) throw new HttpError('Data supervisi tidak ditemukan', 404);

    // Role check
    if (userRole === 'guru' && supervision.teacher_id.toString() !== teacherIdFromToken) {
      throw new HttpError('Akses ditolak', 403);
    }
    if (userRole === 'penilai' && supervision.supervisor_id.toString() !== teacherIdFromToken) {
      throw new HttpError('Akses ditolak', 403);
    }

    return serializeSupervision(supervision);
  },

  async create(dto: CreateSupervisionDto, userId: string, userRole: string) {
    if (userRole === 'guru') throw new HttpError('Guru tidak dapat membuat jadwal supervisi', 403);

    const createdId = await prisma.$transaction(async (tx) => {
      // Check references
      const instruments = await tx.instrument.findMany({ where: { id: { in: dto.instrument_ids.map(id => BigInt(id)) } }, include: { items: { where: { is_active: true } } } });
      if (instruments.length === 0) throw new HttpError('Instrumen tidak ditemukan', 404);
      
      const allItems = instruments.flatMap(inst => inst.items);
      if (allItems.length === 0) throw new HttpError('Instrumen yang dipilih tidak memiliki item penilaian aktif', 400);

      const scheduledDate = dto.scheduled_date ? new Date(dto.scheduled_date) : null;
      // create full date object for time
      const scheduledTime = dto.scheduled_time ? new Date(`1970-01-01T${dto.scheduled_time}:00Z`) : null;
      
      const supervisionDate = dto.supervision_type === 'LANGSUNG' 
        ? (dto.supervision_date ? new Date(dto.supervision_date) : new Date())
        : null;

      const supervision = await tx.supervision.create({
        data: {
          period_id: BigInt(dto.period_id),
          teacher_id: BigInt(dto.teacher_id),
          supervisor_id: BigInt(dto.supervisor_id),
          instruments: { connect: dto.instrument_ids.map(id => ({ id: BigInt(id) })) },
          subject_id: dto.subject_id ? BigInt(dto.subject_id) : null,
          classroom_id: dto.classroom_id ? BigInt(dto.classroom_id) : null,
          supervision_type: dto.supervision_type,
          status: dto.supervision_type === 'LANGSUNG' ? 'DRAFT' : 'TERJADWAL',
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          supervision_date: supervisionDate,
          location: dto.location || null,
          initial_note: dto.initial_note || null,
          created_by: BigInt(userId)
        }
      });

      // Generate items
      const itemsData = allItems.map(item => ({
        supervision_id: supervision.id,
        instrument_item_id: item.id,
        item_category: item.category,
        item_code: item.code,
        item_description: item.description,
        max_score: item.max_score
      }));

      await tx.supervisionItem.createMany({ data: itemsData });

      // Dummy notification and WA
      if (dto.supervision_type === 'TERJADWAL') {
        const teacherUser = await tx.user.findUnique({ where: { teacher_id: BigInt(dto.teacher_id) }});
        if (teacherUser) {
          await tx.notification.create({
            data: {
              user_id: teacherUser.id,
              title: 'Jadwal Supervisi Baru',
              message: `Anda memiliki jadwal supervisi baru pada tanggal ${dto.scheduled_date}.`,
              type: 'INFO'
            }
          });
        }

        const prefs = await tx.appPreference.findFirst();
        if (prefs?.enable_wa_notification) {
          const teacher = await tx.teacher.findUnique({ where: { id: BigInt(dto.teacher_id) }});
          const template = await tx.waTemplate.findUnique({ where: { code: 'JADWAL_SUPERVISI' }});
          if (teacher?.phone && template) {
            await tx.waLog.create({
              data: {
                template_id: template.id,
                supervision_id: supervision.id,
                teacher_id: teacher.id,
                phone: teacher.phone,
                message: `Halo ${teacher.name}, ada jadwal supervisi baru... (DUMMY)`,
                status: 'PENDING'
              }
            });
          }
        }
      }

      return supervision.id;
    });

    return this.getById(createdId.toString(), 'admin');
  },

  async updateSchedule(id: string, dto: UpdateScheduleDto, userRole: string, teacherIdFromToken?: string) {
    if (userRole === 'guru') throw new HttpError('Akses ditolak', 403);

    const supervision = await prisma.supervision.findUnique({ where: { id: BigInt(id) } });
    if (!supervision) throw new HttpError('Data tidak ditemukan', 404);
    
    if (userRole === 'penilai' && supervision.supervisor_id.toString() !== teacherIdFromToken) {
      throw new HttpError('Akses ditolak', 403);
    }

    if (supervision.status !== 'TERJADWAL' && supervision.status !== 'DRAFT') {
      throw new HttpError('Hanya dapat merubah jadwal untuk status TERJADWAL atau DRAFT', 400);
    }

    const updated = await prisma.supervision.update({
      where: { id: BigInt(id) },
      data: {
        scheduled_date: new Date(dto.scheduled_date),
        scheduled_time: new Date(`1970-01-01T${dto.scheduled_time}:00Z`),
        location: dto.location || null,
        initial_note: dto.initial_note || null,
      },
      include: supervisionIncludes
    });

    return serializeSupervision(updated);
  },

  async cancel(id: string, userRole: string, teacherIdFromToken?: string) {
    if (userRole === 'guru') throw new HttpError('Akses ditolak', 403);

    const supervision = await prisma.supervision.findUnique({ where: { id: BigInt(id) } });
    if (!supervision) throw new HttpError('Data tidak ditemukan', 404);

    if (userRole === 'penilai' && supervision.supervisor_id.toString() !== teacherIdFromToken) {
      throw new HttpError('Akses ditolak', 403);
    }

    if (supervision.status === 'SELESAI') {
      throw new HttpError('Tidak dapat membatalkan supervisi yang sudah selesai', 400);
    }

    const updated = await prisma.supervision.update({
      where: { id: BigInt(id) },
      data: { status: 'DIBATALKAN' }
    });

    return serializeSupervision(updated);
  },

  async getItems(id: string) {
    const items = await prisma.supervisionItem.findMany({
      where: { supervision_id: BigInt(id) },
      orderBy: { instrumentItem: { sort_order: 'asc' } }
    });
    return items.map(serializeItem);
  },

  async saveDraft(id: string, dto: SaveDraftDto, userRole: string, teacherIdFromToken?: string) {
    return prisma.$transaction(async (tx) => {
      const supervision = await tx.supervision.findUnique({ 
        where: { id: BigInt(id) }, 
        include: { items: true } 
      });
      if (!supervision) throw new HttpError('Data tidak ditemukan', 404);

      if (userRole === 'guru' || (userRole === 'penilai' && supervision.supervisor_id.toString() !== teacherIdFromToken)) {
        throw new HttpError('Akses ditolak', 403);
      }

      if (supervision.status === 'DIBATALKAN' || supervision.status === 'SELESAI') {
        throw new HttpError('Tidak dapat merubah supervisi yang sudah selesai/dibatalkan', 400);
      }

      // Update items
      const scoreRanges = await tx.scoreRange.findMany();
      let totalMaxScore = 0;
      let totalCurrentScore = 0;

      for (const inputItem of dto.items) {
        const dbItem = supervision.items.find(i => Number(i.id) === inputItem.supervision_item_id);
        if (!dbItem) continue;

        if (inputItem.score !== null && inputItem.score > dbItem.max_score) {
          throw new HttpError(`Skor item ${dbItem.item_code} melebihi maksimal`, 400);
        }

        totalMaxScore += dbItem.max_score;
        if (inputItem.score !== null) {
          totalCurrentScore += inputItem.score;
        }

        const itemStatus = getItemStatus(inputItem.score, dbItem.max_score);

        await tx.supervisionItem.update({
          where: { id: dbItem.id },
          data: {
            score: inputItem.score,
            note: inputItem.note || null,
            item_status: itemStatus
          }
        });
      }

      const finalScore = calculateFinalScore(totalCurrentScore, totalMaxScore);
      const finalStatus = getScoreStatus(finalScore, scoreRanges);

      const updated = await tx.supervision.update({
        where: { id: BigInt(id) },
        data: {
          status: 'DRAFT',
          total_score: totalCurrentScore,
          max_score: totalMaxScore,
          final_score: finalScore,
          final_status: finalStatus,
          strength_note: dto.strength_note || null,
          improvement_note: dto.improvement_note || null,
          general_note: dto.general_note || null,
          recommendation_note: dto.recommendation_note || null,
          conclusion_note: dto.conclusion_note || null,
          supervision_date: supervision.supervision_date || new Date()
        },
        include: { ...supervisionIncludes, items: true }
      });

      return serializeSupervision(updated);
    });
  },

  async submitFinal(id: string, dto: SubmitFinalDto, userId: string, userRole: string, teacherIdFromToken?: string) {
    return prisma.$transaction(async (tx) => {
      const supervision = await tx.supervision.findUnique({ 
        where: { id: BigInt(id) }, 
        include: { items: true } 
      });
      if (!supervision) throw new HttpError('Data tidak ditemukan', 404);

      if (userRole === 'guru' || (userRole === 'penilai' && supervision.supervisor_id.toString() !== teacherIdFromToken)) {
        throw new HttpError('Akses ditolak', 403);
      }

      if (supervision.status === 'DIBATALKAN' || supervision.status === 'SELESAI') {
        throw new HttpError('Tidak dapat merubah supervisi yang sudah selesai/dibatalkan', 400);
      }

      // Validate all items have score
      if (dto.items.length !== supervision.items.length) {
        throw new HttpError('Semua item harus dinilai', 400);
      }

      // Update items
      const scoreRanges = await tx.scoreRange.findMany();
      let totalMaxScore = 0;
      let totalCurrentScore = 0;

      for (const inputItem of dto.items) {
        const dbItem = supervision.items.find(i => Number(i.id) === inputItem.supervision_item_id);
        if (!dbItem) throw new HttpError(`Item ${inputItem.supervision_item_id} tidak valid`, 400);

        if (inputItem.score > dbItem.max_score) {
          throw new HttpError(`Skor item ${dbItem.item_code} melebihi maksimal`, 400);
        }

        totalMaxScore += dbItem.max_score;
        totalCurrentScore += inputItem.score;

        const itemStatus = getItemStatus(inputItem.score, dbItem.max_score);

        await tx.supervisionItem.update({
          where: { id: dbItem.id },
          data: {
            score: inputItem.score,
            note: inputItem.note || null,
            item_status: itemStatus
          }
        });
      }

      const finalScore = calculateFinalScore(totalCurrentScore, totalMaxScore);
      const finalStatus = getScoreStatus(finalScore, scoreRanges);

      const updated = await tx.supervision.update({
        where: { id: BigInt(id) },
        data: {
          status: 'SELESAI',
          total_score: totalCurrentScore,
          max_score: totalMaxScore,
          final_score: finalScore,
          final_status: finalStatus,
          strength_note: dto.strength_note || null,
          improvement_note: dto.improvement_note || null,
          general_note: dto.general_note || null,
          recommendation_note: dto.recommendation_note || null,
          conclusion_note: dto.conclusion_note || null,
          submitted_at: new Date(),
          submitted_by: BigInt(userId),
          supervision_date: dto.supervision_date ? new Date(dto.supervision_date) : (supervision.supervision_date || new Date())
        },
        include: { ...supervisionIncludes, items: true }
      });

      // Create reflection placeholder
      const existingReflection = await tx.teacherReflection.findUnique({ where: { supervision_id: supervision.id }});
      if (!existingReflection) {
        await tx.teacherReflection.create({
          data: {
            supervision_id: supervision.id,
            teacher_id: supervision.teacher_id,
            status: 'BELUM_DIISI'
          }
        });
      }

      // Notifications and logs
      const teacherUser = await tx.user.findUnique({ where: { teacher_id: supervision.teacher_id }});
      if (teacherUser) {
        await tx.notification.create({
          data: {
            user_id: teacherUser.id,
            title: 'Hasil Supervisi Keluar',
            message: `Nilai akhir Anda: ${finalScore} (${finalStatus})`,
            type: 'SUCCESS'
          }
        });
      }

      const prefs = await tx.appPreference.findFirst();
      if (prefs?.enable_wa_notification) {
        const teacher = await tx.teacher.findUnique({ where: { id: supervision.teacher_id }});
        const template = await tx.waTemplate.findUnique({ where: { code: 'HASIL_SUPERVISI' }});
        if (teacher?.phone && template) {
          await tx.waLog.create({
            data: {
              template_id: template.id,
              supervision_id: supervision.id,
              teacher_id: teacher.id,
              phone: teacher.phone,
              message: `Halo ${teacher.name}, Hasil supervisi sudah keluar... (DUMMY)`,
              status: 'PENDING'
            }
          });
        }
      }

      return serializeSupervision(updated);
    });
  }
};
