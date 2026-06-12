import prisma from '../../config/database';
import { HttpError } from '../../common/middlewares/error.middleware';
import { parsePagination, buildMeta } from '../../common/utils/pagination';
import { Request } from 'express';
import { SubmitReflectionDto } from './reflection.validation';
import { ReflectionStatus } from '@prisma/client';

const serializeReflection = (r: any) => ({
  id: Number(r.id).toString(),
  supervisionId: Number(r.supervision_id).toString(),
  teacherId: Number(r.teacher_id).toString(),
  strengthReflection: r.strength_reflection,
  obstacleReflection: r.obstacle_reflection,
  improvementPlan: r.improvement_plan,
  supportNeeded: r.support_needed,
  targetDate: r.target_date ? r.target_date.toISOString().split('T')[0] : null,
  status: r.status,
  submittedAt: r.submitted_at?.toISOString() || null,
  readAt: r.read_at?.toISOString() || null,
  createdAt: r.created_at?.toISOString(),
  updatedAt: r.updated_at?.toISOString(),
  teacher: r.teacher ? {
    id: Number(r.teacher.id).toString(),
    name: r.teacher.name,
    nip: r.teacher.nip,
    photo: r.teacher.photo ? `${process.env.APP_URL || 'http://localhost:5000'}/${r.teacher.photo}` : null
  } : undefined,
  supervision: r.supervision ? {
    id: Number(r.supervision.id).toString(),
    periodId: Number(r.supervision.period_id).toString(),
    supervisionDate: r.supervision.supervision_date?.toISOString().split('T')[0] || null,
    finalScore: Number(r.supervision.final_score),
    finalStatus: r.supervision.final_status
  } : undefined
});

export const reflectionService = {
  async getAll(req: Request, userRole: string, teacherIdFromToken?: string) {
    const { page, limit, skip } = parsePagination(req);
    const where: any = {};

    if (req.query.period_id) where.supervision = { period_id: BigInt(req.query.period_id as string) };
    if (req.query.teacher_id) where.teacher_id = BigInt(req.query.teacher_id as string);
    if (req.query.status) where.status = req.query.status as ReflectionStatus;
    if (req.query.instrument_id) {
      where.supervision = { ...where.supervision, instrument_id: BigInt(req.query.instrument_id as string) };
    }

    if (userRole === 'Guru') {
      where.teacher_id = BigInt(teacherIdFromToken!);
    } else if (userRole === 'Penilai') {
      where.supervision = { ...where.supervision, supervisor_id: BigInt(teacherIdFromToken!) };
    }

    const [data, total] = await Promise.all([
      prisma.teacherReflection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
        include: { teacher: true, supervision: true }
      }),
      prisma.teacherReflection.count({ where })
    ]);

    return {
      data: data.map(serializeReflection),
      meta: buildMeta(total, page, limit)
    };
  },

  async getBySupervisionId(supervisionId: string, userRole: string, teacherIdFromToken?: string) {
    const reflection = await prisma.teacherReflection.findUnique({
      where: { supervision_id: BigInt(supervisionId) },
      include: { teacher: true, supervision: true }
    });

    if (!reflection) return null; // Frontend can handle null if not filled yet

    if (userRole === 'Guru' && reflection.teacher_id.toString() !== teacherIdFromToken) {
      throw new HttpError('Akses ditolak', 403);
    }
    if (userRole === 'Penilai' && reflection.supervision.supervisor_id.toString() !== teacherIdFromToken) {
      throw new HttpError('Akses ditolak', 403);
    }

    return serializeReflection(reflection);
  },

  async submit(supervisionId: string, dto: SubmitReflectionDto, userRole: string, teacherIdFromToken?: string) {
    return prisma.$transaction(async (tx) => {
      const supervision = await tx.supervision.findUnique({ where: { id: BigInt(supervisionId) } });
      if (!supervision) throw new HttpError('Supervisi tidak ditemukan', 404);

      if (supervision.status !== 'SELESAI') {
        throw new HttpError('Refleksi hanya dapat diisi jika supervisi telah SELESAI', 400);
      }

      if (userRole === 'Guru' && supervision.teacher_id.toString() !== teacherIdFromToken) {
        throw new HttpError('Anda hanya dapat mengisi refleksi untuk supervisi Anda sendiri', 403);
      }

      let reflection = await tx.teacherReflection.findUnique({ where: { supervision_id: BigInt(supervisionId) } });

      const targetDate = dto.target_date ? new Date(dto.target_date) : null;

      if (!reflection) {
        reflection = await tx.teacherReflection.create({
          data: {
            supervision_id: supervision.id,
            teacher_id: supervision.teacher_id,
            strength_reflection: dto.strength_reflection,
            obstacle_reflection: dto.obstacle_reflection,
            improvement_plan: dto.improvement_plan,
            support_needed: dto.support_needed || null,
            target_date: targetDate,
            status: 'SUDAH_DIISI',
            submitted_at: new Date()
          }
        });
      } else {
        reflection = await tx.teacherReflection.update({
          where: { id: reflection.id },
          data: {
            strength_reflection: dto.strength_reflection,
            obstacle_reflection: dto.obstacle_reflection,
            improvement_plan: dto.improvement_plan,
            support_needed: dto.support_needed || null,
            target_date: targetDate,
            status: reflection.status === 'BELUM_DIISI' ? 'SUDAH_DIISI' : reflection.status,
            submitted_at: reflection.submitted_at || new Date()
          }
        });
      }

      // Notify supervisor
      const supervisorUser = await tx.user.findUnique({ where: { teacher_id: supervision.supervisor_id }});
      if (supervisorUser && reflection.status === 'SUDAH_DIISI') {
        const teacher = await tx.teacher.findUnique({ where: { id: supervision.teacher_id }});
        await tx.notification.create({
          data: {
            user_id: supervisorUser.id,
            title: 'Refleksi Guru Telah Diisi',
            message: `Guru ${teacher?.name} telah mengisi refleksi untuk supervisi ${supervisionDateStr(supervision.supervision_date)}.`,
            type: 'INFO'
          }
        });
      }

      const fullReflection = await tx.teacherReflection.findUnique({
        where: { id: reflection.id },
        include: { teacher: true, supervision: true }
      });

      return serializeReflection(fullReflection);
    });
  },

  async markAsRead(id: string, userRole: string) {
    if (userRole === 'Guru') throw new HttpError('Akses ditolak', 403);

    const reflection = await prisma.teacherReflection.findUnique({ where: { id: BigInt(id) } });
    if (!reflection) throw new HttpError('Refleksi tidak ditemukan', 404);

    if (reflection.status !== 'SUDAH_DIISI' && reflection.status !== 'SUDAH_DIBACA') {
       throw new HttpError('Refleksi belum diisi', 400);
    }

    const updated = await prisma.teacherReflection.update({
      where: { id: BigInt(id) },
      data: {
        status: 'SUDAH_DIBACA',
        read_at: new Date()
      },
      include: { teacher: true, supervision: true }
    });

    return serializeReflection(updated);
  }
};

function supervisionDateStr(date: Date | null) {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}
