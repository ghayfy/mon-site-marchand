import express from 'express';
import { body, query, validationResult } from 'express-validator';
import slugify from 'slugify';
import mysql from 'mysql2/promise';
const router = express.Router();
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASS || 'app',
  database: process.env.DB_NAME || 'monshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
async function ensureUniqueSlug(baseSlug) {
  const [rows] = await pool.query(
    'SELECT slug FROM products WHERE slug = ? OR slug LIKE ?',
    [baseSlug, `${baseSlug}-%`]
  );
  if (rows.length === 0) return baseSlug;
  let max = 0;
  for (const r of rows) {
    const m = String(r.slug).match(new RegExp(`^${baseSlug}-(\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${baseSlug}-${max + 1}`;
}
router.get(
  '/',
  [query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), query('page').optional().isInt({ min: 1 }).toInt()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const limit = req.query.limit || 10;
      const page = req.query.page || 1;
      const offset = (page - 1) * limit;
      const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM products');
      const [rows] = await pool.query(
        `SELECT id, title, price_h_t, slug, sku, tva, stock, active, created_at, updated_at
         FROM products ORDER BY id LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const items = rows.map(r => ({
        id: r.id,
        name: r.title,
        price: Number(r.price_h_t),
        slug: r.slug,
        sku: r.sku,
        tva: r.tva !== null ? Number(r.tva) : null,
        stock: r.stock,
        active: !!r.active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
      res.json({ items, total, page, limit });
    } catch (e) { next(e); }
  }
);
router.post(
  '/',
  [
    body('name').isString().trim().isLength({ min: 1, max: 255 }),
    body('price').isFloat({ min: 0 }).toFloat(),
    body('sku').optional().isString().trim().isLength({ max: 120 }),
    body('description').optional().isString(),
    body('tva').optional().isFloat({ min: 0, max: 100 }).toFloat(),
    body('stock').optional().isInt({ min: 0 }).toInt(),
    body('active').optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, price, sku = null, description = null, tva = 20.0, stock = 0, active = true } = req.body;
    try {
      const baseSlug = slugify(name, { lower: true, strict: true, locale: 'fr' }) || 'produit';
      const slug = await ensureUniqueSlug(baseSlug);
      const now = new Date();
      const [result] = await pool.execute(
        `INSERT INTO products (title, slug, description, sku, price_h_t, tva, stock, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, slug, description, sku, price, tva, stock, active ? 1 : 0, now, now]
      );
      const id = result.insertId;
      res.status(201).json({
        id, name, price, slug, sku, tva, stock, active,
        createdAt: now.toISOString(), updatedAt: now.toISOString()
      });
    } catch (e) { next(e); }
  }
);
export default router;
