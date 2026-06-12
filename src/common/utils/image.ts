import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const validateImageFile = (file: Express.Multer.File) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Hanya file jpg, jpeg, png, atau webp yang diperbolehkan');
  }
};

export const deleteOldFileIfExists = (filePath: string) => {
  if (!filePath) return;
  const absolutePath = path.join(process.cwd(), filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

export const compressTeacherPhoto = async (file: Express.Multer.File, fileName: string): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'teachers');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Fallback to direct save if sharp is unavailable
  const ext = path.extname(file.originalname) || '.jpg';
  const finalFileName = `${fileName}-${Date.now()}${ext}`;
  const outputPath = path.join(uploadDir, finalFileName);

  fs.writeFileSync(outputPath, file.buffer);

  return `/uploads/teachers/${finalFileName}`;
};

export const compressSchoolLogo = async (file: Express.Multer.File, fileName: string): Promise<string> => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'school');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || '.png';
  const finalFileName = `${fileName}-${Date.now()}${ext}`;
  const outputPath = path.join(uploadDir, finalFileName);

  fs.writeFileSync(outputPath, file.buffer);

  return `/uploads/school/${finalFileName}`;
};
