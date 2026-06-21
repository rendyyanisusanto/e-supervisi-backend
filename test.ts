import prisma from './src/config/database';

async function query() {
  const s = await prisma.supervision.findFirst({ 
    where: { status: { in: ['TERJADWAL', 'DRAFT'] } } 
  });
  console.log('Found draft/terjadwal:', s?.id);
  
  if (s) {
    import('./src/modules/supervisions/supervision.service').then(async ({ supervisionService }) => {
      try {
        const res = await supervisionService.saveDraft(s.id.toString(), {
          items: [
            { supervision_item_id: 1, score: 2, note: null }
          ]
        }, 'penilai', s.supervisor_id.toString());
        console.log('SUCCESS', res);
      } catch (e: any) {
        console.log('ERROR', e.message, e);
      }
    });
  }
}
query();
