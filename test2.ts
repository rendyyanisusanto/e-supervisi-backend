import prisma from './src/config/database';

async function query() {
  const s = await prisma.supervision.findFirst({ 
    where: { status: { in: ['TERJADWAL', 'DRAFT'] } },
    include: { items: true }
  });
  console.log('Found schedule:', s?.id);
  
  if (s) {
    import('./src/modules/supervisions/supervision.service').then(async ({ supervisionService }) => {
      try {
        const payload = {
          items: s.items.map(item => ({
            supervision_item_id: Number(item.id),
            score: 2,
            note: 'test note'
          })),
          strength_note: 'bagus',
          improvement_note: 'kurang',
          recommendation_note: 'lanjutkan',
          conclusion_note: 'ok',
          supervision_date: new Date().toISOString()
        };
        const res = await supervisionService.submitFinal(s.id.toString(), payload, '1', 'penilai', s.supervisor_id.toString());
        console.log('SUCCESS', res.status);
      } catch (e: any) {
        console.log('ERROR submitFinal:', e.message, e);
      }
    });
  }
}
query();
