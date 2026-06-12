# E-Supervisi SMK — Backend API

> REST API backend untuk sistem manajemen supervisi guru berbasis web di lingkungan SMK.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | Express.js |
| ORM | Prisma 5 |
| Database | MySQL 8 |
| Auth | JWT (Access + Refresh Token) |
| Password | bcryptjs |
| Validation | Zod |
| File Upload | Multer |
| Middleware | cors, helmet, morgan |
| Dev Server | tsx (watch mode) |

---

## 🚀 Cara Menjalankan

### 1. Clone & Install

```bash
git clone https://github.com/rendyyanisusanto/e-supervisi-backend.git
cd e-supervisi-backend
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit `.env` sesuaikan dengan konfigurasi lokal Anda:

```env
NODE_ENV=development
PORT=5000

# Sesuaikan dengan MySQL Anda
DATABASE_URL="mysql://root:password@localhost:3306/e_supervisi_smk"

# Ganti dengan secret yang aman (minimal 32 karakter)
JWT_ACCESS_SECRET="your_super_secret_access_key_here"
JWT_REFRESH_SECRET="your_super_secret_refresh_key_here"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"

BCRYPT_SALT_ROUNDS=10
UPLOAD_DIR="uploads"
APP_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:5173"
```

### 3. Setup Database

Buat database MySQL terlebih dahulu:

```sql
CREATE DATABASE e_supervisi_smk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Jalankan Migration & Seed

```bash
# Buat tabel dari schema Prisma
npm run prisma:migrate

# Isi data awal (roles, users, instruments, dll)
npm run prisma:seed
```

### 5. Jalankan Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm run start
```

Server berjalan di: **http://localhost:5000**

---

## 👤 Akun Default (Setelah Seed)

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| kurikulum | admin123 | Kurikulum, Penilai |
| penilai | admin123 | Penilai |
| guru | admin123 | Guru |

---

## 📁 Struktur Folder

```
backend/
├── prisma/
│   ├── schema.prisma       # Schema database lengkap
│   ├── migrations/         # Riwayat migrasi database
│   └── seed.ts             # Data awal aplikasi
├── src/
│   ├── app.ts              # Konfigurasi Express app
│   ├── server.ts           # Entry point server
│   ├── config/             # Konfigurasi (env, database, jwt)
│   ├── common/
│   │   ├── constants/      # Roles, statuses, messages
│   │   ├── middlewares/    # Auth, role guard, error, validation, upload
│   │   ├── utils/          # Response, pagination, password, token, date, score
│   │   └── types/          # Type augmentation Express
│   ├── modules/            # Feature modules (auth, teachers, instruments, dst.)
│   │   ├── auth/
│   │   ├── periods/
│   │   ├── subjects/
│   │   ├── classrooms/
│   │   ├── teachers/
│   │   ├── instruments/
│   │   ├── score-ranges/
│   │   ├── settings/
│   │   ├── wa/
│   │   ├── notifications/
│   │   ├── supervisions/
│   │   ├── reflections/
│   │   └── reports/
│   └── routes/
│       └── index.ts        # Route aggregator
└── uploads/                # File uploads (tidak di-commit)
```

---

## 📡 Endpoint API Utama

### Auth
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Periods
```
GET    /api/periods
GET    /api/periods/active
GET    /api/periods/:id
POST   /api/periods
PUT    /api/periods/:id
DELETE /api/periods/:id
PATCH  /api/periods/:id/activate
```

### Subjects
```
GET    /api/subjects
GET    /api/subjects/:id
POST   /api/subjects
PUT    /api/subjects/:id
DELETE /api/subjects/:id
PATCH  /api/subjects/:id/status
```

### Classrooms
```
GET    /api/classrooms
GET    /api/classrooms/:id
POST   /api/classrooms
PUT    /api/classrooms/:id
DELETE /api/classrooms/:id
PATCH  /api/classrooms/:id/status
```

### Teachers
```
GET    /api/teachers
GET    /api/teachers/:id
POST   /api/teachers
PUT    /api/teachers/:id
DELETE /api/teachers/:id
PATCH  /api/teachers/:id/status
PATCH  /api/teachers/:id/roles
POST   /api/teachers/:id/reset-password
POST   /api/teachers/:id/photo
```

### Instruments
```
GET    /api/instruments
GET    /api/instruments/:id
POST   /api/instruments
PUT    /api/instruments/:id
DELETE /api/instruments/:id
PATCH  /api/instruments/:id/status
POST   /api/instruments/:id/duplicate
GET    /api/instruments/:id/items
POST   /api/instruments/:id/items
PUT    /api/instruments/:id/items/:itemId
DELETE /api/instruments/:id/items/:itemId
PATCH  /api/instruments/:id/items/reorder
```

### Score Ranges
```
GET    /api/score-ranges
GET    /api/score-ranges/:id
POST   /api/score-ranges
PUT    /api/score-ranges/:id
DELETE /api/score-ranges/:id
```

### Settings
```
GET    /api/settings/school-profile
PUT    /api/settings/school-profile
GET    /api/settings/report-settings
PUT    /api/settings/report-settings
GET    /api/settings/app-preferences
PUT    /api/settings/app-preferences
```

### WA Templates
```
GET    /api/wa/templates
GET    /api/wa/templates/:id
POST   /api/wa/templates
PUT    /api/wa/templates/:id
PATCH  /api/wa/templates/:id/status
POST   /api/wa/templates/:id/send-test
```

### Notifications
```
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

### Supervisions
```
GET    /api/supervisions
GET    /api/supervisions/:id
POST   /api/supervisions
PUT    /api/supervisions/:id
DELETE /api/supervisions/:id
PATCH  /api/supervisions/:id/status
POST   /api/supervisions/:id/scores
```

### Reflections
```
GET    /api/reflections
GET    /api/reflections/:id
POST   /api/reflections
PUT    /api/reflections/:id
```

### Reports
```
GET    /api/reports/summary
GET    /api/reports/recap
GET    /api/reports/teacher/:teacherId
```

---

## 🧰 NPM Scripts

```bash
npm run dev               # Development server dengan hot reload
npm run build             # Compile TypeScript ke JavaScript
npm run start             # Jalankan server production
npm run prisma:generate   # Generate Prisma Client
npm run prisma:migrate    # Jalankan database migration
npm run prisma:studio     # Buka Prisma Studio (GUI)
npm run prisma:seed       # Isi data awal ke database
npm run db:reset          # ⚠️ Reset database (HATI-HATI, data hilang!)
npm run lint              # Cek linting
npm run format            # Format kode dengan Prettier
```

---

## 🔗 Catatan Integrasi Frontend

| Item | Keterangan |
|---|---|
| Base URL | `http://localhost:5000/api` |
| Auth Header | `Authorization: Bearer <access_token>` |
| CORS Origin | `http://localhost:5173` |
| Response Format | `{ success, message, data, [meta] }` |
| Frontend Env | Set `VITE_DATA_SOURCE=api` di `.env` frontend |

---

## 📝 Lisensi

Proyek ini dikembangkan untuk keperluan akademis/internal SMK. Seluruh hak cipta milik pengembang.
