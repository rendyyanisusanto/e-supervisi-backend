import { z } from 'zod';

const instrumentTypes = ['ADMINISTRASI', 'PERENCANAAN', 'PELAKSANAAN', 'ATP', 'ASESMEN', 'REFLEKSI', 'LAINNYA'] as const;

export const createInstrumentSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.enum(instrumentTypes),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const updateInstrumentSchema = createInstrumentSchema.partial();

export const createInstrumentItemSchema = z.object({
  category: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  description: z.string().min(1),
  max_score: z.number().int().min(1).default(4),
  sort_order: z.number().int().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const updateInstrumentItemSchema = createInstrumentItemSchema.partial();

export const reorderItemsSchema = z.object({
  items: z.array(z.object({ id: z.number().int(), sort_order: z.number().int() })),
});

export type CreateInstrumentDto = z.infer<typeof createInstrumentSchema>;
export type UpdateInstrumentDto = z.infer<typeof updateInstrumentSchema>;
export type CreateInstrumentItemDto = z.infer<typeof createInstrumentItemSchema>;
export type UpdateInstrumentItemDto = z.infer<typeof updateInstrumentItemSchema>;
export type ReorderItemsDto = z.infer<typeof reorderItemsSchema>;
