import multer from 'multer';
import fs from 'fs';
import path from 'path';

const ensureDir = (dir='uploads') => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureDir('uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file?.originalname || '');
    const name = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  }
});

export const upload = multer({ storage });
export const uploadSingle = upload.single('image'); // champ "image"
