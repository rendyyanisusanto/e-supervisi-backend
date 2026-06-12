import { z } from 'zod';

const waCategories = ['SUPERVISI', 'HASIL', 'REFLEKSI', 'PENGINGAT'] as const;

export const createWaTemplateSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(150),
  description: z.string().optional().nullable(),
  category: z.enum(waCategories).default('SUPERVISI'),
  content: z.string().min(1),
  is_active: z.boolean().optional().default(true),
});

export const updateWaTemplateSchema = createWaTemplateSchema.partial();
export type CreateWaTemplateDto = z.infer<typeof createWaTemplateSchema>;
export type UpdateWaTemplateDto = z.infer<typeof updateWaTemplateSchema>;
