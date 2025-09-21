import express from 'express';
import mysql from 'mysql2/promise';
const router = express.Router();
async function getPool() {
  return await mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASS || 'app',
    database: process.env.DB_NAME || 'monshop',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
}
function csvEscape(v){ if(v==null) return ''; const s=String(v); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
router.get('/admin/orders/export_all.csv', async (_req,res)=>{
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT o.id,
             o.total_t_t_c AS total_ttc,
             o.currency,
             o.status,
             o.provider,
             o.created_at,
             o.updated_at,
             COUNT(oi.id) AS items_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id=o.id
      GROUP BY o.id, o.total_t_t_c, o.currency, o.status, o.provider, o.created_at, o.updated_at
      ORDER BY o.id DESC
    `);
    const lines = [];
    lines.push('id,total_ttc,currency,status,provider,created_at,updated_at,items_count');
    for (const r of rows) {
      lines.push([
        csvEscape(r.id),
        csvEscape(r.total_ttc),
        csvEscape(r.currency),
        csvEscape(r.status),
        csvEscape(r.provider ?? ''),
        csvEscape(r.created_at?.toISOString?.() ?? r.created_at),
        csvEscape(r.updated_at?.toISOString?.() ?? r.updated_at),
        csvEscape(r.items_count)
      ].join(','));
    }
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="orders_all.csv"');
    res.status(200).send(lines.join('\n')+'\n');
  } finally { conn.release(); }
});
export default router;
