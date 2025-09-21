import express from 'express';
import mysql from 'mysql2/promise';
import PDFDocument from 'pdfkit';

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

async function fetchOrder(conn, id) {
  const [o] = await conn.query(
    `SELECT id, total_t_t_c AS total_ttc, currency, status, provider, created_at, updated_at
     FROM orders WHERE id=?`, [id]
  );
  if (!o.length) return null;
  const [items] = await conn.query(
    `SELECT title, qty, price_h_t, tva FROM order_items WHERE order_id=? ORDER BY id`, [id]
  );
  return { order: o[0], items };
}

router.get('/admin/orders/:id(\\d+)/invoice.pdf', async (req, res) => {
  const oid = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(oid) || oid <= 0) return res.status(400).json({ error: 'invalid id' });

  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const data = await fetchOrder(conn, oid);
    if (!data) return res.status(404).json({ error: 'order not found' });
    const { order, items } = data;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${oid}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).text('FACTURE', { align: 'right' });
    doc.moveDown(0.2).fontSize(10).text(`N° ${order.id}`, { align: 'right' });
    doc.text(`Date: ${new Date(order.created_at).toISOString()}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text('Mon Shop', { continued: false });
    doc.fontSize(10).text('42 rue du Code\n75000 Paris\ncontact@monshop.test');
    doc.moveDown();
    doc.fontSize(12).text('Client', { continued: false });
    doc.fontSize(10).text('(coordonnées client à venir)');
    doc.moveDown();
    const startY = doc.y;
    doc.fontSize(12).text('Articles', 50, startY);
    doc.moveDown(0.5);
    doc.fontSize(10);
    const xTitle=50, xQty=320, xPrice=370, xTva=440, xSubtotal=500;
    doc.text('Désignation', xTitle, doc.y, { width: 250 });
    doc.text('Qté', xQty, startY, { width: 40, align: 'right' });
    doc.text('Prix HT', xPrice, startY, { width: 60, align: 'right' });
    doc.text('TVA %', xTva, startY, { width: 50, align: 'right' });
    doc.text('Sous-total TTC', xSubtotal, startY, { width: 80, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();

    let totalTTC = 0;
    for (const it of items) {
      const ht = Number(it.price_h_t) * Number(it.qty);
      const tvaRate = Number(it.tva) / 100;
      const ttc = +(ht * (1 + tvaRate)).toFixed(2);
      totalTTC += ttc;
      doc.moveDown(0.2);
      const y = doc.y;
      doc.text(it.title, xTitle, y, { width: 250 });
      doc.text(String(it.qty), xQty, y, { width: 40, align: 'right' });
      doc.text(ht.toFixed(2), xPrice, y, { width: 60, align: 'right' });
      doc.text(Number(it.tva).toFixed(2), xTva, y, { width: 50, align: 'right' });
      doc.text(ttc.toFixed(2), xSubtotal, y, { width: 80, align: 'right' });
    }
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total TTC (${order.currency}): ${totalTTC.toFixed(2)}`, { align: 'right' });
    doc.fontSize(10).text(`Statut: ${order.status} • Provider: ${order.provider || '-'}`, { align: 'right' });
    doc.end();
  } finally {
    conn.release();
  }
});

export default router;
