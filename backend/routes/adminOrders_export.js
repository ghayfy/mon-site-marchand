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
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}
async function fetchOrder(conn, id) {
  const [oRows] = await conn.query(
    `SELECT id, total_t_t_c AS total_ttc, currency, status, provider, created_at, updated_at
     FROM orders WHERE id=?`, [id]
  );
  if (oRows.length === 0) return null;
  const [iRows] = await conn.query(
    `SELECT title, qty, price_h_t, tva
     FROM order_items WHERE order_id=? ORDER BY id`, [id]
  );
  return { order:oRows[0], items:iRows };
}
async function sendCsvForOrder(_req, res, id) {
  const oid = Number.parseInt(id, 10);
  if (!Number.isFinite(oid) || oid <= 0) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const data = await fetchOrder(conn, oid);
    if (!data) return res.status(404).json({ error: 'order not found' });
    const { order, items } = data;
    const lines = [];
    lines.push('order_id,total_ttc,currency,status,provider,created_at,updated_at');
    lines.push([
      csvEscape(order.id),
      csvEscape(order.total_ttc),
      csvEscape(order.currency),
      csvEscape(order.status),
      csvEscape(order.provider ?? ''),
      csvEscape(order.created_at?.toISOString?.() ?? order.created_at),
      csvEscape(order.updated_at?.toISOString?.() ?? order.updated_at),
    ].join(','));
    lines.push('');
    lines.push('title,qty,price_h_t,tva');
    for (const it of items) {
      lines.push([csvEscape(it.title), csvEscape(it.qty), csvEscape(it.price_h_t), csvEscape(it.tva)].join(','));
    }
    const csv = lines.join('\n') + '\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="order_${oid}.csv"`);
    res.status(200).send(csv);
  } finally {
    conn.release();
  }
}
router.get('/admin/orders/:id(\\d+)/export.csv', (req, res) => sendCsvForOrder(req, res, req.params.id));
router.get('/admin/orders/:id(\\d+)\\.csv',       (req, res) => sendCsvForOrder(req, res, req.params.id));
router.get('/admin/orders/export.csv', (req,res)=>sendCsvForOrder(req,res,req.query.id));
// PDF minimal valide (stub)
router.get('/admin/orders/export.pdf', (req,res)=>{
  const pdf='%PDF-1.4\n1 0 obj<<>>endobj\n2 0 obj<<>>endobj\n3 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n4 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 5 0 R/Resources<</Font<</F1 6 0 R>>>>>>endobj\n5 0 obj<</Length 55>>stream\nBT /F1 12 Tf 72 60 Td (Export PDF non impl\\303\\251ment\\303\\251) Tj ET\nendstream endobj\n6 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 7\n0000000000 65535 f \n0000000010 00000 n \n0000000041 00000 n \n0000000070 00000 n \n0000000119 00000 n \n0000000240 00000 n \n0000000352 00000 n \ntrailer<</Size 7/Root 3 0 R>>\nstartxref\n445\n%%EOF\n';
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename="order.pdf"');
  res.status(200).send(pdf);
});
router.get('/admin/orders/:id(\\d+)/export.pdf', (req,res)=>{
  // même PDF minimal; on pourrait plus tard générer un vrai reçu avec l'ID
  const pdf='%PDF-1.4\n1 0 obj<<>>endobj\n2 0 obj<<>>endobj\n3 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n4 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 5 0 R/Resources<</Font<</F1 6 0 R>>>>>>endobj\n5 0 obj<</Length 70>>stream\nBT /F1 12 Tf 40 60 Td (Order ID: '+req.params.id+') Tj ET\nendstream endobj\n6 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 7\n0000000000 65535 f \n0000000010 00000 n \n0000000041 00000 n \n0000000070 00000 n \n0000000119 00000 n \n0000000250 00000 n \n0000000362 00000 n \ntrailer<</Size 7/Root 3 0 R>>\nstartxref\n455\n%%EOF\n';
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename="order_'+req.params.id+'.pdf"');
  res.status(200).send(pdf);
});
export default router;
