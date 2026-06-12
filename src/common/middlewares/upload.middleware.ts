import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createStorage = (subDir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(env.UPLOAD_DIR, subDir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, jpg, png, webp)'));
  }
};

export const teacherPhotoUpload = multer({
  storage: createStorage('teachers'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('photo');

export const schoolLogoUpload = multer({
  storage: createStorage('school'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('logo');
