import { saveDraftSchema } from './src/modules/supervisions/supervision.validation';

try {
  const payload = {
    items: [
      { supervision_item_id: 106, score: 4, note: null }
    ],
    strength_note: null,
    improvement_note: null,
    recommendation_note: null,
    conclusion_note: null,
    documentation_url: null
  };
  
  const parsed = saveDraftSchema.parse(payload);
  console.log('SUCCESS', parsed);
} catch (e: any) {
  console.error('ERROR', e.errors);
}
