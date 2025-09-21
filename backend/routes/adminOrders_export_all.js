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
    namedPlaceholders: true,
  });
}

function csvEscape(v){ if(v==null) return ''; const s=String(v); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }

function parseFilters(q){
  const where = [];
  const params = {};

  if (q.status) {
    const list = String(q.status).split(',').map(s=>s.trim()).filter(Boolean);
    if (list.length) {
      where.push(`o.status IN (:status_list)`);
      params.status_list = list;
    }
  }

  if (q.date_from) {
    where.push(`o.created_at >= :date_from`);
    params.date_from = q.date_from;
  }
  if (q.date_to) {
    where.push(`o.created_at <= :date_to`);
    params.date_to = q.date_to;
  }

  const clause = where.length ? ('WHERE ' + where.join(' AND ')) : '';
  return { clause, params };
}

router.get('/admin/orders/export_all.csv', async (req, res) => {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const { clause, params } = parseFilters(req.query);
    const sql = `
      SELECT
        o.id,
        o.total_t_t_c AS total_ttc,
        o.currency,
        o.status,
        o.provider,
        o.created_at,
        o.updated_at,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
      FROM orders o
      ${clause}
      ORDER BY o.id DESC
    `;
    const [rows] = await conn.query({ sql, namedPlaceholders: true }, params);

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
        csvEscape(r.items_count),
      ].join(','));
    }
    const csv = lines.join('\n') + '\n';
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="orders_all.csv"');
    res.status(200).send(csv);
  } finally {
    conn.release();
  }
});

export default router;
