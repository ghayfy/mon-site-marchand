import { Router } from 'express';
import sequelize from '../config/db.js';
const router = Router();
router.get('/api/admin/products', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;
    const [[countRow]] = await sequelize.query(
      'SELECT COUNT(*) AS total FROM products'
    );
    const total = Number(countRow.total) || 0;
    const [rows] = await sequelize.query(
      'SELECT id, title, price_h_t, stock, active FROM products ORDER BY id LIMIT :limit OFFSET :offset',
      { replacements: { limit, offset } }
    );
    const items = rows.map(r => ({
      id: r.id,
      name: r.title,
      price: r.price_h_t !== null ? Number(r.price_h_t) : 0,
      stock: r.stock ?? 0,
      active: !!r.active
    }));
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});
export default router;
