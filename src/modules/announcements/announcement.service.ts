import prisma from '../../config/database';

const mapAnnouncement = (a: any) => ({
  ...a,
  id: Number(a.id),
});

export const announcementService = {
  async getAll() {
    // Return latest 5 announcements
    const announcements = await prisma.announcement.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    
    // Seed dummy announcements if empty
    if (announcements.length === 0) {
      const dummyAnnouncements = [
        {
          title: 'Jadwal Supervisi Semester Genap',
          summary: 'Jadwal supervisi akademik semester genap tahun 2026 telah dirilis. Harap periksa dashboard masing-masing.',
          content: 'Detail lengkap...'
        },
        {
          title: 'Pengisian Refleksi Diperpanjang',
          summary: 'Batas akhir pengisian refleksi pasca supervisi diperpanjang hingga Jumat.',
          content: 'Detail lengkap...'
        }
      ];
      
      for (const a of dummyAnnouncements) {
        await prisma.announcement.create({ data: a });
      }
      
      const newAnnouncements = await prisma.announcement.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
        take: 5
      });
      return newAnnouncements.map(mapAnnouncement);
    }
    
    return announcements.map(mapAnnouncement);
  }
};
