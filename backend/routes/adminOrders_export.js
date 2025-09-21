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
async function fetchOrder(conn, id){
  const [o] = await conn.query(
    `SELECT id,total_t_t_c AS total_ttc,currency,status,provider,created_at,updated_at FROM orders WHERE id=?`, [id]
  );
  if(!o.length) return null;
  const [it] = await conn.query(
    `SELECT title,qty,price_h_t,tva FROM order_items WHERE order_id=? ORDER BY id`, [id]
  );
  return { order:o[0], items:it };
}
async function sendCsvForOrder(req,res,id){
  const oid = Number.parseInt(id,10);
  if(!Number.isFinite(oid) || oid<=0) return res.status(400).json({error:'invalid id'});
  const pool = await getPool(); const conn = await pool.getConnection();
  try{
    const data = await fetchOrder(conn, oid);
    if(!data) return res.status(404).json({error:'order not found'});
    const {order,items} = data;
    const lines = [];
    lines.push('order_id,total_ttc,currency,status,provider,created_at,updated_at');
    lines.push([
      csvEscape(order.id),csvEscape(order.total_ttc),csvEscape(order.currency),csvEscape(order.status),
      csvEscape(order.provider ?? ''),csvEscape(order.created_at?.toISOString?.() ?? order.created_at),
      csvEscape(order.updated_at?.toISOString?.() ?? order.updated_at)
    ].join(','));
    lines.push('');
    lines.push('title,qty,price_h_t,tva');
    for(const it of items){
      lines.push([csvEscape(it.title),csvEscape(it.qty),csvEscape(it.price_h_t),csvEscape(it.tva)].join(','));
    }
    const csv = lines.join('\n')+'\n';
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',`attachment; filename="order_${oid}.csv"`);
    res.status(200).send(csv);
  } finally { conn.release(); }
}
export default router;
router.get('/admin/orders/:id(\\d+)/export.csv', (req,res)=>sendCsvForOrder(req,res,req.params.id));
router.get('/admin/orders/:id(\\d+)\\.csv',       (req,res)=>sendCsvForOrder(req,res,req.params.id));
export default router;
