import { z } from 'zod';

export const createSupervisionSchema = z.object({
  period_id: z.union([z.string(), z.number()]).transform(Number),
  teacher_id: z.union([z.string(), z.number()]).transform(Number),
  supervisor_id: z.union([z.string(), z.number()]).transform(Number),
  instrument_ids: z.array(z.union([z.string(), z.number()]).transform(Number)).min(1, 'Pilih minimal 1 instrumen'),
  subject_id: z.union([z.string(), z.number()]).transform(Number).optional().nullable(),
  classroom_id: z.union([z.string(), z.number()]).transform(Number).optional().nullable(),
  supervision_type: z.enum(['LANGSUNG', 'TERJADWAL']),
  scheduled_date: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  supervision_date: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  initial_note: z.string().optional().nullable()
}).refine((data) => {
  if (data.supervision_type === 'TERJADWAL') {
    return !!data.scheduled_date && !!data.scheduled_time;
  }
  return true;
}, {
  message: "scheduled_date dan scheduled_time wajib diisi untuk tipe TERJADWAL",
  path: ["scheduled_date"]
});

export const updateScheduleSchema = z.object({
  scheduled_date: z.string(),
  scheduled_time: z.string(),
  location: z.string().optional().nullable(),
  initial_note: z.string().optional().nullable()
});

export const saveDraftSchema = z.object({
  items: z.array(z.object({
    supervision_item_id: z.union([z.string(), z.number()]).transform(Number),
    score: z.number().int().min(0).nullable(),
    note: z.string().optional().nullable()
  })).min(1, 'Items tidak boleh kosong'),
  strength_note: z.string().optional().nullable(),
  improvement_note: z.string().optional().nullable(),
  general_note: z.string().optional().nullable(),
  recommendation_note: z.string().optional().nullable(),
  conclusion_note: z.string().optional().nullable()
});

export const submitFinalSchema = z.object({
  items: z.array(z.object({
    supervision_item_id: z.union([z.string(), z.number()]).transform(Number),
    score: z.number().int().min(0),
    note: z.string().optional().nullable()
  })).min(1, 'Items tidak boleh kosong'),
  strength_note: z.string().optional().nullable(),
  improvement_note: z.string().optional().nullable(),
  general_note: z.string().optional().nullable(),
  recommendation_note: z.string().optional().nullable(),
  conclusion_note: z.string().optional().nullable(),
  supervision_date: z.string().optional().nullable() // Boleh diupdate saat finalisasi jika belum ada
});

export type CreateSupervisionDto = z.infer<typeof createSupervisionSchema>;
export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;
export type SaveDraftDto = z.infer<typeof saveDraftSchema>;
export type SubmitFinalDto = z.infer<typeof submitFinalSchema>;
