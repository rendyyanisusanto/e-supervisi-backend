// ===============================
// E-SUPERVISI SMK - DATABASE DESIGN
// Versi 1 Sekolah
// ===============================


// ===============================
// MASTER PERIODE
// ===============================

Table periods {
  id bigint [pk, increment]
  name varchar(150) [not null] // Contoh: Semester Ganjil 2026/2027
  start_date date [not null]
  end_date date [not null]
  is_active boolean [default: false]
  created_at datetime
  updated_at datetime
}


// ===============================
// MASTER GURU & AKUN
// ===============================

Table teachers {
  id bigint [pk, increment]
  photo varchar(255)
  name varchar(150) [not null]
  nip varchar(50)
  nuptk varchar(50)
  nik varchar(50)
  gender enum('L', 'P')
  email varchar(100)
  phone varchar(30)
  main_subject_id bigint
  position varchar(100) // Guru, Kepala Sekolah, Waka Kurikulum, Kaprodi, dll
  is_active boolean [default: true]
  created_at datetime
  updated_at datetime
}

Table users {
  id bigint [pk, increment]
  teacher_id bigint [not null]
  username varchar(100) [not null, unique]
  password varchar(255) [not null]
  name varchar(150) [not null]
  email varchar(100)
  is_active boolean [default: true]
  last_login_at datetime
  created_at datetime
  updated_at datetime
}

Table roles {
  id bigint [pk, increment]
  name varchar(50) [not null, unique] // admin, kurikulum, penilai, guru
  label varchar(100) [not null]
  created_at datetime
  updated_at datetime
}

Table user_roles {
  id bigint [pk, increment]
  user_id bigint [not null]
  role_id bigint [not null]
  created_at datetime

  indexes {
    (user_id, role_id) [unique]
  }
}


// ===============================
// MASTER MAPEL & KELAS
// ===============================

Table subjects {
  id bigint [pk, increment]
  code varchar(50)
  name varchar(150) [not null]
  group_name varchar(100) // Umum, Produktif, Muatan Lokal, dll
  is_active boolean [default: true]
  created_at datetime
  updated_at datetime
}

Table classrooms {
  id bigint [pk, increment]
  name varchar(100) [not null] // X TKJ 1
  grade varchar(20) // X, XI, XII
  major varchar(100) // TKJ, RPL, TKR, dll
  homeroom_teacher_id bigint
  is_active boolean [default: true]
  created_at datetime
  updated_at datetime
}


// ===============================
// MASTER INSTRUMEN SUPERVISI
// ===============================

Table instruments {
  id bigint [pk, increment]
  code varchar(50) [not null]
  name varchar(200) [not null]
  type enum('ADMINISTRASI', 'PERENCANAAN', 'PELAKSANAAN', 'ATP', 'ASESMEN', 'REFLEKSI', 'LAINNYA') [not null]
  description text
  is_active boolean [default: true]
  created_at datetime
  updated_at datetime
}

Table instrument_items {
  id bigint [pk, increment]
  instrument_id bigint [not null]
  category varchar(150) [not null] // Administrasi, Perencanaan, Pelaksanaan, dll
  code varchar(50) [not null] // A.1, A.2, B.1
  description text [not null]
  max_score int [not null, default: 4]
  sort_order int [default: 0]
  is_active boolean [default: true]
  created_at datetime
  updated_at datetime

  indexes {
    (instrument_id, code) [unique]
  }
}

Table score_ranges {
  id bigint [pk, increment]
  min_score decimal(5,2) [not null]
  max_score decimal(5,2) [not null]
  status varchar(100) [not null] // Optimal, Baik, Cukup, Perlu Pembinaan, Kurang
  color varchar(30) // green, blue, yellow, orange, red
  description text
  created_at datetime
  updated_at datetime
}


// ===============================
// SUPERVISI
// ===============================

Table supervisions {
  id bigint [pk, increment]
  period_id bigint [not null]
  teacher_id bigint [not null] // Guru yang dinilai
  supervisor_id bigint [not null] // Guru yang menjadi penilai
  instrument_id bigint [not null]
  subject_id bigint
  classroom_id bigint

  supervision_type enum('LANGSUNG', 'TERJADWAL') [not null, default: 'LANGSUNG']
  status enum('TERJADWAL', 'DRAFT', 'SELESAI', 'DIBATALKAN') [not null, default: 'DRAFT']

  scheduled_date date
  scheduled_time time
  supervision_date date
  location varchar(150)

  initial_note text

  total_score decimal(8,2) [default: 0]
  max_score decimal(8,2) [default: 0]
  final_score decimal(5,2) [default: 0]
  final_status varchar(100)

  strength_note text // Kekuatan guru
  improvement_note text // Area perbaikan
  general_note text // Catatan umum penilai
  recommendation_note text // Rekomendasi umum manual
  conclusion_note text // Kesimpulan penilai

  submitted_at datetime
  created_by bigint
  submitted_by bigint
  created_at datetime
  updated_at datetime
}

Table supervision_items {
  id bigint [pk, increment]
  supervision_id bigint [not null]
  instrument_item_id bigint [not null]

  item_category varchar(150) [not null]
  item_code varchar(50) [not null]
  item_description text [not null]

  max_score int [not null]
  score int
  item_status varchar(100)
  note text

  created_at datetime
  updated_at datetime

  indexes {
    (supervision_id, instrument_item_id) [unique]
  }
}


// ===============================
// REFLEKSI GURU
// ===============================

Table teacher_reflections {
  id bigint [pk, increment]
  supervision_id bigint [not null]
  teacher_id bigint [not null]

  strength_reflection text // Apa kekuatan pembelajaran/perangkat Anda?
  obstacle_reflection text // Kendala yang dialami
  improvement_plan text // Apa yang akan diperbaiki?
  support_needed text // Dukungan yang dibutuhkan
  target_date date // Target perbaikan

  status enum('BELUM_DIISI', 'SUDAH_DIISI', 'SUDAH_DIBACA') [not null, default: 'BELUM_DIISI']

  submitted_at datetime
  read_at datetime
  created_at datetime
  updated_at datetime

  indexes {
    supervision_id [unique]
  }
}


// ===============================
// NOTIFIKASI WA
// ===============================

Table wa_templates {
  id bigint [pk, increment]
  code varchar(100) [not null, unique]
  name varchar(150) [not null]
  content text [not null]
  is_active boolean [default: true]
  created_at datetime
  updated_at datetime
}

Table wa_logs {
  id bigint [pk, increment]
  template_id bigint
  supervision_id bigint
  teacher_id bigint
  phone varchar(30) [not null]
  message text [not null]
  status enum('PENDING', 'SENT', 'FAILED') [not null, default: 'PENDING']
  response text
  sent_at datetime
  created_at datetime
  updated_at datetime
}


// ===============================
// PENGATURAN SISTEM
// ===============================

Table school_profiles {
  id bigint [pk, increment]
  name varchar(200) [not null]
  npsn varchar(50)
  address text
  phone varchar(30)
  email varchar(100)
  logo varchar(255)

  principal_name varchar(150)
  principal_nip varchar(50)
  curriculum_name varchar(150)
  curriculum_nip varchar(50)

  report_footer text
  created_at datetime
  updated_at datetime
}

Table report_settings {
  id bigint [pk, increment]
  letterhead_image varchar(255)
  show_logo boolean [default: true]
  show_principal_signature boolean [default: true]
  show_supervisor_signature boolean [default: true]
  show_curriculum_signature boolean [default: false]
  use_qr_validation boolean [default: false]
  document_number_format varchar(150)
  footer_text text
  created_at datetime
  updated_at datetime
}


// ===============================
// RELATIONS
// ===============================

Ref: teachers.main_subject_id > subjects.id
Ref: classrooms.homeroom_teacher_id > teachers.id

Ref: users.teacher_id > teachers.id
Ref: user_roles.user_id > users.id
Ref: user_roles.role_id > roles.id

Ref: instrument_items.instrument_id > instruments.id

Ref: supervisions.period_id > periods.id
Ref: supervisions.teacher_id > teachers.id
Ref: supervisions.supervisor_id > teachers.id
Ref: supervisions.instrument_id > instruments.id
Ref: supervisions.subject_id > subjects.id
Ref: supervisions.classroom_id > classrooms.id
Ref: supervisions.created_by > users.id
Ref: supervisions.submitted_by > users.id

Ref: supervision_items.supervision_id > supervisions.id
Ref: supervision_items.instrument_item_id > instrument_items.id

Ref: teacher_reflections.supervision_id > supervisions.id
Ref: teacher_reflections.teacher_id > teachers.id

Ref: wa_logs.template_id > wa_templates.id
Ref: wa_logs.supervision_id > supervisions.id
Ref: wa_logs.teacher_id > teachers.id