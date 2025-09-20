import fs from 'fs';
import path from 'path';

// Sharp est optionnel : on tente un import dynamique.
// Si indisponible (Docker Alpine sans libvips), on renvoie le fichier original.
let sharp = null;
try {
  const mod = await import('sharp').catch(() => null);
  sharp = mod?.default || null;
} catch { /* noop */ }

export async function processProductImage(localPath, { makeWebp = true, maxWidth = 1200 } = {}) {
  const dir = path.dirname(localPath);
  const base = path.basename(localPath, path.extname(localPath));
  const outFiles = { original: localPath, webp: null };

  if (!sharp) return outFiles; // Pas de sharp : on s'arrête là

  try {
    const img = sharp(localPath).rotate();
    const resized = img.resize({ width: maxWidth, withoutEnlargement: true });
    const webpPath = path.join(dir, `${base}.webp`);
    await resized.webp({ quality: 85 }).toFile(webpPath);
    outFiles.webp = webpPath;
  } catch (e) {
    console.warn('Sharp processing failed:', e.message);
  }
  return outFiles;
}
