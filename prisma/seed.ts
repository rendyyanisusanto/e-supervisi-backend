import { PrismaClient, Gender, InstrumentType, SupervisionType, SupervisionStatus, ReflectionStatus, WaCategory, NotificationType, PaperSize, PaperOrientation, ReportHeaderStyle } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==============================
  // 1. ROLES
  // ==============================
  const roleData = [
    { name: 'admin', label: 'Administrator' },
    { name: 'kurikulum', label: 'Waka Kurikulum' },
    { name: 'penilai', label: 'Penilai/Supervisor' },
    { name: 'guru', label: 'Guru' },
  ];

  const roles: Record<string, any> = {};
  for (const r of roleData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label },
      create: r,
    });
  }
  console.log('✅ Roles seeded');

  // ==============================
  // 2. SUBJECTS
  // ==============================
  const subjectData = [
    { code: 'INF', name: 'Informatika', group_name: 'Umum' },
    { code: 'TKJ', name: 'Produktif TKJ', group_name: 'Produktif' },
    { code: 'BIN', name: 'Bahasa Indonesia', group_name: 'Umum' },
    { code: 'MTK', name: 'Matematika', group_name: 'Umum' },
    { code: 'PAI', name: 'Pendidikan Agama Islam', group_name: 'Umum' },
  ];

  const subjects: Record<string, any> = {};
  for (const s of subjectData) {
    subjects[s.code] = await prisma.subject.upsert({
      where: { code: s.code },
      update: s,
      create: s,
    });
  }
  console.log('✅ Subjects seeded');

  // ==============================
  // 3. PERIODS
  // ==============================
  const periodGanjil = await prisma.period.upsert({
    where: { id: 1n },
    update: { name: 'Semester Ganjil 2026/2027', is_active: true },
    create: {
      id: 1n,
      name: 'Semester Ganjil 2026/2027',
      start_date: new Date('2026-07-14'),
      end_date: new Date('2026-12-19'),
      is_active: true,
    },
  });

  const periodGenap = await prisma.period.upsert({
    where: { id: 2n },
    update: { name: 'Semester Genap 2025/2026', is_active: false },
    create: {
      id: 2n,
      name: 'Semester Genap 2025/2026',
      start_date: new Date('2026-01-06'),
      end_date: new Date('2026-06-20'),
      is_active: false,
    },
  });
  console.log('✅ Periods seeded');

  // ==============================
  // 4. TEACHERS
  // ==============================
  const teacherData = [
    { id: 1n, name: 'Administrator Sekolah', position: 'Admin Sistem', gender: Gender.L },
    { id: 2n, name: 'Rendy Yani Susanto', position: 'Waka Kurikulum', gender: Gender.L, main_subject_id: subjects['TKJ'].id },
    { id: 3n, name: 'Ahmad Fauzi, S.Pd', position: 'Guru', gender: Gender.L, main_subject_id: subjects['MTK'].id },
    { id: 4n, name: 'Siti Aminah, S.Pd', position: 'Guru', gender: Gender.P, main_subject_id: subjects['BIN'].id },
    { id: 5n, name: 'Budi Santoso, S.Kom', position: 'Guru', gender: Gender.L, main_subject_id: subjects['INF'].id },
    { id: 6n, name: 'Nur Hidayah, S.Pd', position: 'Guru', gender: Gender.P, main_subject_id: subjects['PAI'].id },
    { id: 7n, name: 'Hasan Basri, S.Pd', position: 'Guru', gender: Gender.L, main_subject_id: subjects['PAI'].id },
  ];

  const teachers: Record<string, any> = {};
  for (const t of teacherData) {
    teachers[t.name] = await prisma.teacher.upsert({
      where: { id: t.id },
      update: { name: t.name, position: t.position },
      create: {
        id: t.id,
        name: t.name,
        position: t.position,
        gender: t.gender,
        is_active: true,
        main_subject_id: (t as any).main_subject_id ?? null,
      },
    });
  }
  console.log('✅ Teachers seeded');

  // ==============================
  // 5. USERS
  // ==============================
  const defaultPassword = await bcrypt.hash('admin123', 10);

  const userData = [
    { username: 'admin', name: 'Administrator Sekolah', teacherName: 'Administrator Sekolah', roles: ['admin'] },
    { username: 'kurikulum', name: 'Rendy Yani Susanto', teacherName: 'Rendy Yani Susanto', roles: ['kurikulum', 'penilai'] },
    { username: 'penilai', name: 'Ahmad Fauzi, S.Pd', teacherName: 'Ahmad Fauzi, S.Pd', roles: ['penilai'] },
    { username: 'guru', name: 'Siti Aminah, S.Pd', teacherName: 'Siti Aminah, S.Pd', roles: ['guru'] },
  ];

  const users: Record<string, any> = {};
  for (const u of userData) {
    const teacher = teachers[u.teacherName];
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name },
      create: {
        teacher_id: teacher.id,
        username: u.username,
        password: defaultPassword,
        name: u.name,
        is_active: true,
      },
    });
    users[u.username] = user;

    // Assign roles (delete existing first for idempotency)
    await prisma.userRole.deleteMany({ where: { user_id: user.id } });
    for (const roleName of u.roles) {
      await prisma.userRole.create({
        data: { user_id: user.id, role_id: roles[roleName].id },
      });
    }
  }
  console.log('✅ Users seeded');

  // ==============================
  // 6. CLASSROOMS
  // ==============================
  const classroomData = [
    { id: 1n, name: 'X TKJ 1', grade: 'X', major: 'TKJ' },
    { id: 2n, name: 'XI TKJ 1', grade: 'XI', major: 'TKJ' },
    { id: 3n, name: 'XII TKJ 1', grade: 'XII', major: 'TKJ' },
    { id: 4n, name: 'X RPL 1', grade: 'X', major: 'RPL' },
  ];

  const classrooms: Record<string, any> = {};
  for (const c of classroomData) {
    classrooms[c.name] = await prisma.classroom.upsert({
      where: { id: c.id },
      update: { name: c.name },
      create: { id: c.id, name: c.name, grade: c.grade, major: c.major, is_active: true },
    });
  }
  console.log('✅ Classrooms seeded');

  // ==============================
  // 7. INSTRUMENTS
  // ==============================
  const instrumentData = [
    { id: 1n, code: 'INS-ADM', name: 'Monitoring Administrasi Pembelajaran', type: InstrumentType.ADMINISTRASI, description: 'Instrumen untuk memonitor kelengkapan administrasi pembelajaran guru' },
    { id: 2n, code: 'INS-ATP', name: 'Supervisi Alur Tujuan Pembelajaran', type: InstrumentType.ATP, description: 'Instrumen supervisi alur tujuan pembelajaran (ATP)' },
    { id: 3n, code: 'INS-PEL', name: 'Supervisi Pelaksanaan Pembelajaran', type: InstrumentType.PELAKSANAAN, description: 'Instrumen supervisi pelaksanaan pembelajaran di kelas' },
    { id: 4n, code: 'INS-REN', name: 'Supervisi Perencanaan Pembelajaran Mendalam', type: InstrumentType.PERENCANAAN, description: 'Instrumen supervisi perencanaan pembelajaran secara mendalam' },
  ];

  const instruments: Record<string, any> = {};
  for (const ins of instrumentData) {
    instruments[ins.code] = await prisma.instrument.upsert({
      where: { code: ins.code },
      update: { name: ins.name },
      create: { id: ins.id, code: ins.code, name: ins.name, type: ins.type, description: ins.description, is_active: true },
    });
  }
  console.log('✅ Instruments seeded');

  // ==============================
  // 8. INSTRUMENT ITEMS
  // ==============================
  const itemsData = [
    // INS-ADM
    { instrument_code: 'INS-ADM', category: 'Administrasi', code: 'A.1', description: 'Apakah guru memiliki SK Pembagian Tugas Mengajar dari kepala sekolah tahun pelajaran terakhir', max_score: 4, sort_order: 1 },
    { instrument_code: 'INS-ADM', category: 'Administrasi', code: 'A.2', description: 'Apakah guru memiliki jadwal pelajaran minimal 24 jam per minggu', max_score: 4, sort_order: 2 },
    { instrument_code: 'INS-ADM', category: 'Administrasi', code: 'A.3', description: 'Apakah guru memiliki Kalender Pendidikan', max_score: 4, sort_order: 3 },
    { instrument_code: 'INS-ADM', category: 'Administrasi', code: 'A.4', description: 'Apakah guru membuat program tahunan dalam tahun terakhir', max_score: 4, sort_order: 4 },
    // INS-ATP
    { instrument_code: 'INS-ATP', category: 'Alur Tujuan Pembelajaran', code: 'B.1', description: 'Guru memiliki dokumen CP yang sesuai', max_score: 4, sort_order: 1 },
    { instrument_code: 'INS-ATP', category: 'Alur Tujuan Pembelajaran', code: 'B.2', description: 'Guru menyusun ATP sesuai CP dan fase', max_score: 4, sort_order: 2 },
    { instrument_code: 'INS-ATP', category: 'Alur Tujuan Pembelajaran', code: 'B.3', description: 'Tujuan pembelajaran disusun runtut dan terukur', max_score: 4, sort_order: 3 },
    // INS-PEL
    { instrument_code: 'INS-PEL', category: 'Pelaksanaan Pembelajaran', code: 'C.1', description: 'Guru membuka pembelajaran dengan salam dan apersepsi', max_score: 4, sort_order: 1 },
    { instrument_code: 'INS-PEL', category: 'Pelaksanaan Pembelajaran', code: 'C.2', description: 'Guru menyampaikan tujuan pembelajaran', max_score: 4, sort_order: 2 },
    { instrument_code: 'INS-PEL', category: 'Pelaksanaan Pembelajaran', code: 'C.3', description: 'Guru menggunakan metode pembelajaran yang sesuai', max_score: 4, sort_order: 3 },
    { instrument_code: 'INS-PEL', category: 'Pelaksanaan Pembelajaran', code: 'C.4', description: 'Guru melakukan asesmen formatif', max_score: 4, sort_order: 4 },
    { instrument_code: 'INS-PEL', category: 'Pelaksanaan Pembelajaran', code: 'C.5', description: 'Guru menutup pembelajaran dengan refleksi', max_score: 4, sort_order: 5 },
    // INS-REN
    { instrument_code: 'INS-REN', category: 'Perencanaan Pembelajaran', code: 'D.1', description: 'Guru menyusun modul ajar sesuai ketentuan', max_score: 4, sort_order: 1 },
    { instrument_code: 'INS-REN', category: 'Perencanaan Pembelajaran', code: 'D.2', description: 'Aktivitas pembelajaran sesuai tujuan', max_score: 4, sort_order: 2 },
    { instrument_code: 'INS-REN', category: 'Perencanaan Pembelajaran', code: 'D.3', description: 'Asesmen sesuai tujuan pembelajaran', max_score: 4, sort_order: 3 },
    { instrument_code: 'INS-REN', category: 'Perencanaan Pembelajaran', code: 'D.4', description: 'Terdapat rencana diferensiasi pembelajaran', max_score: 4, sort_order: 4 },
  ];

  const instrumentItems: Record<string, any> = {};
  for (const item of itemsData) {
    const instrument = instruments[item.instrument_code];
    const existing = await prisma.instrumentItem.findFirst({
      where: { instrument_id: instrument.id, code: item.code },
    });
    const upserted = existing
      ? await prisma.instrumentItem.update({ where: { id: existing.id }, data: { description: item.description, max_score: item.max_score, sort_order: item.sort_order } })
      : await prisma.instrumentItem.create({ data: { instrument_id: instrument.id, category: item.category, code: item.code, description: item.description, max_score: item.max_score, sort_order: item.sort_order, is_active: true } });
    instrumentItems[`${item.instrument_code}.${item.code}`] = upserted;
  }
  console.log('✅ Instrument items seeded');

  // ==============================
  // 9. SCORE RANGES
  // ==============================
  const scoreRangeData = [
    { min_score: 90, max_score: 100, status: 'Optimal', color: 'green' },
    { min_score: 80, max_score: 89.99, status: 'Baik', color: 'blue' },
    { min_score: 70, max_score: 79.99, status: 'Cukup', color: 'yellow' },
    { min_score: 60, max_score: 69.99, status: 'Perlu Pembinaan', color: 'orange' },
    { min_score: 0, max_score: 59.99, status: 'Kurang', color: 'red' },
  ];

  await prisma.scoreRange.deleteMany();
  for (const sr of scoreRangeData) {
    await prisma.scoreRange.create({ data: { min_score: sr.min_score, max_score: sr.max_score, status: sr.status, color: sr.color } });
  }
  console.log('✅ Score ranges seeded');

  // ==============================
  // 10. SCHOOL PROFILE
  // ==============================
  const existingProfile = await prisma.schoolProfile.findFirst();
  if (!existingProfile) {
    await prisma.schoolProfile.create({
      data: {
        name: 'SMK IT Asy-Syadzili',
        npsn: '20500000',
        address: 'Jl. Pesantren No. 1, Malang',
        city: 'Malang',
        province: 'Jawa Timur',
        phone: '081234567890',
        email: 'info@smkitasy-syadzili.sch.id',
        website: 'https://smkitasy-syadzili.sch.id',
        principal_name: 'Drs. Kepala Sekolah',
        principal_nip: '196800000000000000',
        curriculum_name: 'Rendy Yani Susanto',
        curriculum_nip: '-',
        report_footer: 'Dokumen ini dicetak melalui Sistem E-Supervisi SMK.',
      },
    });
  }
  console.log('✅ School profile seeded');

  // ==============================
  // 11. REPORT SETTINGS
  // ==============================
  const existingReportSettings = await prisma.reportSetting.findFirst();
  if (!existingReportSettings) {
    await prisma.reportSetting.create({
      data: {
        show_logo: true,
        show_school_address: true,
        show_principal_signature: true,
        show_supervisor_signature: true,
        show_curriculum_signature: true,
        use_qr_validation: false,
        document_number_format: 'SUP/{jenis}/{bulan}/{tahun}/{nomor}',
        paper_size: PaperSize.A4,
        orientation: PaperOrientation.PORTRAIT,
        header_style: ReportHeaderStyle.FORMAL,
        footer_text: 'E-Supervisi SMK - Supervisi Guru Berbasis Data',
      },
    });
  }
  console.log('✅ Report settings seeded');

  // ==============================
  // 12. APP PREFERENCES
  // ==============================
  const existingPrefs = await prisma.appPreference.findFirst();
  if (!existingPrefs) {
    await prisma.appPreference.create({
      data: {
        auto_use_active_period: true,
        auto_save_assessment: true,
        require_note_for_low_score: true,
        low_score_threshold: 2,
        default_score_max: 4,
        enable_wa_notification: true,
        enable_reflection_reminder: true,
      },
    });
  }
  console.log('✅ App preferences seeded');

  // ==============================
  // 13. WA TEMPLATES
  // ==============================
  const waTemplateData = [
    {
      code: 'JADWAL_SUPERVISI',
      name: 'Notifikasi Jadwal Supervisi',
      category: WaCategory.SUPERVISI,
      description: 'Template untuk mengirim notifikasi jadwal supervisi kepada guru',
      content: `Yth. Bapak/Ibu *{nama_guru}*\n\nDengan hormat, kami informasikan bahwa Anda akan disupervisi pada:\n\n📅 *Tanggal:* {tanggal}\n⏰ *Waktu:* {waktu}\n📍 *Lokasi:* {lokasi}\n📋 *Instrumen:* {instrumen}\n👤 *Penilai:* {penilai}\n\nMohon mempersiapkan diri dengan baik.\n\nTerima kasih.\n_Tim E-Supervisi SMK_`,
      is_active: true,
    },
    {
      code: 'HASIL_SUPERVISI',
      name: 'Notifikasi Hasil Supervisi',
      category: WaCategory.HASIL,
      description: 'Template untuk mengirim hasil supervisi kepada guru',
      content: `Yth. Bapak/Ibu *{nama_guru}*\n\nHasil supervisi Anda telah tersedia:\n\n📊 *Nilai Akhir:* {nilai} ({status})\n📋 *Instrumen:* {instrumen}\n📅 *Tanggal Supervisi:* {tanggal}\n\nSilakan login ke sistem E-Supervisi untuk melihat detail hasil dan mengisi refleksi.\n\nTerima kasih.\n_Tim E-Supervisi SMK_`,
      is_active: true,
    },
    {
      code: 'REFLEKSI_BELUM_DIISI',
      name: 'Pengingat Refleksi Belum Diisi',
      category: WaCategory.REFLEKSI,
      description: 'Template pengingat untuk guru yang belum mengisi refleksi',
      content: `Yth. Bapak/Ibu *{nama_guru}*\n\nKami mengingatkan bahwa refleksi supervisi Anda tanggal *{tanggal}* belum diisi.\n\nMohon segera mengisi refleksi melalui sistem E-Supervisi SMK.\n\n⏰ *Batas waktu:* {batas_waktu}\n\nTerima kasih atas perhatiannya.\n_Tim E-Supervisi SMK_`,
      is_active: true,
    },
    {
      code: 'PENGINGAT_JADWAL',
      name: 'Pengingat Jadwal H-1',
      category: WaCategory.PENGINGAT,
      description: 'Template pengingat supervisi H-1 sebelum jadwal',
      content: `Yth. Bapak/Ibu *{nama_guru}*\n\n🔔 *Pengingat:* Supervisi Anda dijadwalkan *besok*:\n\n📅 *Tanggal:* {tanggal}\n⏰ *Waktu:* {waktu}\n📍 *Lokasi:* {lokasi}\n\nMohon pastikan kesiapan perangkat pembelajaran Anda.\n\nTerima kasih.\n_Tim E-Supervisi SMK_`,
      is_active: true,
    },
  ];

  for (const wt of waTemplateData) {
    await prisma.waTemplate.upsert({
      where: { code: wt.code },
      update: { name: wt.name, content: wt.content },
      create: wt,
    });
  }
  console.log('✅ WA templates seeded');

  // ==============================
  // 14. NOTIFICATIONS
  // ==============================
  await prisma.notification.deleteMany();
  const notifications = [
    { title: 'Supervisi Dijadwalkan', message: 'Supervisi Ahmad Fauzi, S.Pd dijadwalkan hari ini pukul 09.00', type: NotificationType.INFO },
    { title: 'Hasil Supervisi Final', message: 'Hasil supervisi Budi Santoso, S.Kom sudah final dengan nilai Baik (82.5)', type: NotificationType.SUCCESS },
    { title: 'Refleksi Belum Diisi', message: 'Nur Hidayah, S.Pd belum mengisi refleksi supervisi tanggal 5 Juni 2026', type: NotificationType.WARNING },
    { title: 'Pesan WA Gagal', message: 'Pesan WhatsApp pengingat jadwal untuk Hasan Basri, S.Pd gagal dikirim', type: NotificationType.ERROR },
    { title: 'Aspek Asesmen Rendah', message: 'Rata-rata aspek asesmen semester ini masih di bawah 70. Perlu perhatian khusus.', type: NotificationType.WARNING },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: { ...n, is_read: false } });
  }
  console.log('✅ Notifications seeded');

  // ==============================
  // 15. SUPERVISIONS (dummy)
  // ==============================
  const adminUser = users['admin'];
  const kurikulumUser = users['kurikulum'];

  const supervisionData = [
    {
      id: 1n,
      period_id: periodGanjil.id,
      teacher_id: teachers['Ahmad Fauzi, S.Pd'].id,
      supervisor_id: teachers['Rendy Yani Susanto'].id,
      instruments: { connect: [{ id: instruments['INS-PEL'].id }] },
      subject_id: subjects['MTK'].id,
      classroom_id: classrooms['X TKJ 1'].id,
      supervision_type: SupervisionType.TERJADWAL,
      status: SupervisionStatus.TERJADWAL,
      scheduled_date: new Date('2026-07-15'),
      location: 'Ruang X TKJ 1',
      created_by: adminUser.id,
    },
    {
      id: 2n,
      period_id: periodGanjil.id,
      teacher_id: teachers['Siti Aminah, S.Pd'].id,
      supervisor_id: teachers['Rendy Yani Susanto'].id,
      instruments: { connect: [{ id: instruments['INS-ADM'].id }] },
      supervision_type: SupervisionType.LANGSUNG,
      status: SupervisionStatus.DRAFT,
      created_by: adminUser.id,
    },
    {
      id: 3n,
      period_id: periodGanjil.id,
      teacher_id: teachers['Budi Santoso, S.Kom'].id,
      supervisor_id: teachers['Rendy Yani Susanto'].id,
      instruments: { connect: [{ id: instruments['INS-PEL'].id }] },
      subject_id: subjects['INF'].id,
      classroom_id: classrooms['XI TKJ 1'].id,
      supervision_type: SupervisionType.TERJADWAL,
      status: SupervisionStatus.SELESAI,
      scheduled_date: new Date('2026-07-10'),
      supervision_date: new Date('2026-07-10'),
      location: 'Ruang XI TKJ 1',
      total_score: 18,
      max_score: 20,
      final_score: 90,
      final_status: 'Optimal',
      strength_note: 'Guru sangat menguasai materi dan pengelolaan kelas sangat baik',
      improvement_note: 'Perlu lebih banyak variasi soal formatif',
      submitted_at: new Date('2026-07-10'),
      created_by: adminUser.id,
      submitted_by: kurikulumUser.id,
    },
    {
      id: 4n,
      period_id: periodGanjil.id,
      teacher_id: teachers['Nur Hidayah, S.Pd'].id,
      supervisor_id: teachers['Rendy Yani Susanto'].id,
      instruments: { connect: [{ id: instruments['INS-ADM'].id }] },
      supervision_type: SupervisionType.LANGSUNG,
      status: SupervisionStatus.SELESAI,
      supervision_date: new Date('2026-07-05'),
      total_score: 14,
      max_score: 16,
      final_score: 87.5,
      final_status: 'Baik',
      strength_note: 'Administrasi lengkap dan rapi',
      improvement_note: 'Beberapa dokumen perlu diperbarui',
      submitted_at: new Date('2026-07-05'),
      created_by: adminUser.id,
      submitted_by: kurikulumUser.id,
    },
    {
      id: 5n,
      period_id: periodGanjil.id,
      teacher_id: teachers['Hasan Basri, S.Pd'].id,
      supervisor_id: teachers['Rendy Yani Susanto'].id,
      instruments: { connect: [{ id: instruments['INS-REN'].id }] },
      supervision_type: SupervisionType.TERJADWAL,
      status: SupervisionStatus.DIBATALKAN,
      scheduled_date: new Date('2026-07-08'),
      created_by: adminUser.id,
    },
  ];

  for (const s of supervisionData) {
    await prisma.supervision.upsert({
      where: { id: s.id },
      update: { status: s.status },
      create: s as any,
    });
  }
  console.log('✅ Supervisions seeded');

  // ==============================
  // Supervision Items for SELESAI supervisions
  // ==============================
  const sup3Items = [
    { instrument_item_code: 'INS-PEL.C.1', score: 4 },
    { instrument_item_code: 'INS-PEL.C.2', score: 4 },
    { instrument_item_code: 'INS-PEL.C.3', score: 4 },
    { instrument_item_code: 'INS-PEL.C.4', score: 3 },
    { instrument_item_code: 'INS-PEL.C.5', score: 3 },
  ];

  for (const si of sup3Items) {
    const item = instrumentItems[si.instrument_item_code];
    if (!item) continue;
    const existingSI = await prisma.supervisionItem.findFirst({ where: { supervision_id: 3n, instrument_item_id: item.id } });
    if (!existingSI) {
      await prisma.supervisionItem.create({
        data: {
          supervision_id: 3n,
          instrument_item_id: item.id,
          item_category: item.category,
          item_code: item.code,
          item_description: item.description,
          max_score: item.max_score,
          score: si.score,
        },
      });
    }
  }

  const sup4Items = [
    { instrument_item_code: 'INS-ADM.A.1', score: 4 },
    { instrument_item_code: 'INS-ADM.A.2', score: 4 },
    { instrument_item_code: 'INS-ADM.A.3', score: 3 },
    { instrument_item_code: 'INS-ADM.A.4', score: 3 },
  ];

  for (const si of sup4Items) {
    const item = instrumentItems[si.instrument_item_code];
    if (!item) continue;
    const existingSI = await prisma.supervisionItem.findFirst({ where: { supervision_id: 4n, instrument_item_id: item.id } });
    if (!existingSI) {
      await prisma.supervisionItem.create({
        data: {
          supervision_id: 4n,
          instrument_item_id: item.id,
          item_category: item.category,
          item_code: item.code,
          item_description: item.description,
          max_score: item.max_score,
          score: si.score,
        },
      });
    }
  }
  console.log('✅ Supervision items seeded');

  // ==============================
  // 16. TEACHER REFLECTIONS
  // ==============================
  // Budi sudah mengisi refleksi
  const existingRef3 = await prisma.teacherReflection.findFirst({ where: { supervision_id: 3n } });
  if (!existingRef3) {
    await prisma.teacherReflection.create({
      data: {
        supervision_id: 3n,
        teacher_id: teachers['Budi Santoso, S.Kom'].id,
        strength_reflection: 'Saya merasa sudah mampu mengelola kelas dengan baik dan materi tersampaikan dengan efektif',
        obstacle_reflection: 'Beberapa siswa masih kesulitan dengan konsep abstrak dalam informatika',
        improvement_plan: 'Akan menggunakan lebih banyak contoh nyata dan simulasi praktikum',
        support_needed: 'Dibutuhkan lebih banyak alat peraga dan akses laboratorium komputer',
        target_date: new Date('2026-08-01'),
        status: ReflectionStatus.SUDAH_DIISI,
        submitted_at: new Date('2026-07-11'),
      },
    });
  }

  // Nur Hidayah belum mengisi refleksi
  const existingRef4 = await prisma.teacherReflection.findFirst({ where: { supervision_id: 4n } });
  if (!existingRef4) {
    await prisma.teacherReflection.create({
      data: {
        supervision_id: 4n,
        teacher_id: teachers['Nur Hidayah, S.Pd'].id,
        status: ReflectionStatus.BELUM_DIISI,
      },
    });
  }
  console.log('✅ Teacher reflections seeded');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Default accounts:');
  console.log('   admin      / admin123  → Role: admin');
  console.log('   kurikulum  / admin123  → Role: kurikulum, penilai');
  console.log('   penilai    / admin123  → Role: penilai');
  console.log('   guru       / admin123  → Role: guru');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
