import { PrismaClient, Gender, WaCategory, PaperSize, PaperOrientation, ReportHeaderStyle } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...');

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
  // 2. ADMIN TEACHER & USER
  // ==============================
  const adminPassword = await bcrypt.hash('!Detected404', 10);

  const adminTeacher = await prisma.teacher.upsert({
    where: { id: 1n },
    update: { name: 'Administrator', position: 'Admin Sistem' },
    create: {
      id: 1n,
      name: 'Administrator',
      position: 'Admin Sistem',
      gender: Gender.L,
      is_active: true,
    },
  });
  console.log('✅ Admin teacher seeded');

  const adminUser = await prisma.user.upsert({
    where: { teacher_id: adminTeacher.id },
    update: { username: '404', name: 'Administrator', password: adminPassword }, // Update username and password if exists
    create: {
      teacher_id: adminTeacher.id,
      username: '404',
      password: adminPassword,
      name: 'Administrator',
      is_active: true,
    },
  });

  // Assign admin role
  await prisma.userRole.deleteMany({ where: { user_id: adminUser.id } });
  await prisma.userRole.create({
    data: { user_id: adminUser.id, role_id: roles['admin'].id },
  });
  console.log('✅ Admin user seeded');

  // ==============================
  // 3. SCORE RANGES
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
  // 4. REPORT SETTINGS
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
  // 5. APP PREFERENCES
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
  // 6. WA TEMPLATES
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

  console.log('\n🎉 Production Seed completed successfully!');
  console.log('\n📋 Admin Account:');
  console.log('   Username : 404');
  console.log('   Password : !Detected404');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
