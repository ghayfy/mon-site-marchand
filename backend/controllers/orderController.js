import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import { models } from '../models/index.js';
import { cartTotals, applyCouponBeforeTax } from '../utils/pricing.js';
import { computeShipping } from '../utils/shipping.js';

const CURRENCY = process.env.CURRENCY || 'EUR';

async function loadCartWithItems(userId) {
  const cart = await models.Cart.findOne({ where: { userId } });
  if (!cart) return { cart:null, items:[] };
  const items = await models.CartItem.findAll({
    where: { cartId: cart.id },
    include: [{ model: models.Product }]
  });
  return { cart, items };
}

async function findCoupon(code) {
  if (!code) return null;
  const row = await models.Coupon.findOne({ where: { code, active: true }});
  if (!row) return null;
  const now = new Date();
  if (row.startsAt && row.startsAt > now) return null;
  if (row.endsAt && row.endsAt < now) return null;
  return row;
}

export const quote = async (req,res) => {
  const userId = req.user.id;
  const { code, shippingAddress } = req.body||{};
  const { items } = await loadCartWithItems(userId);
  if (!items.length) return res.status(400).json({ error: 'Panier vide' });

  const base = cartTotals(items);
  const coupon = await findCoupon(code);

  const { discountHT, subtotalAfter } = applyCouponBeforeTax(base.subtotalHT, coupon);
  const vatRateWeighted = base.subtotalHT ? base.vat / base.subtotalHT * 100 : 0;
  const vatAfter = +(subtotalAfter * vatRateWeighted/100).toFixed(2);
  const ttcAfter = +(subtotalAfter + vatAfter).toFixed(2);

  const ship = computeShipping({
    mode: (process.env.SHIPPING_MODE||'flat'),
    flat: process.env.SHIPPING_FLAT,
    base: process.env.SHIPPING_BASE,
    perKg: process.env.SHIPPING_PER_KG,
    weightTotal: base.weightTotal
  });

  const grandTotal = +(ttcAfter + ship.amount).toFixed(2);

  res.json({
    currency: CURRENCY,
    items: items.map(i => ({
      productId: i.productId,
      qty: i.qty,
      snapshot: i.priceSnapshot
    })),
    pricing: {
      subtotalHT: +subtotalAfter.toFixed(2),
      discountHT,
      vat: vatAfter,
      shipping: ship,
      totalTTC: grandTotal
    },
    shippingAddress: shippingAddress || null,
    coupon: coupon ? { code: coupon.code, percentOff: coupon.percentOff, amountOff: coupon.amountOff } : null
  });
};

export const createIntent = async (req,res) => {
  const userId = req.user.id;
  const { shippingAddress, billingAddress, code } = req.body||{};
  const { cart, items } = await loadCartWithItems(userId);
  if (!items.length) return res.status(400).json({ error: 'Panier vide' });

  // calculs
  const base = cartTotals(items);
  const coupon = await findCoupon(code);
  const { discountHT, subtotalAfter } = applyCouponBeforeTax(base.subtotalHT, coupon);
  const vatRateWeighted = base.subtotalHT ? base.vat / base.subtotalHT * 100 : 0;
  const vatAfter = +(subtotalAfter * vatRateWeighted/100).toFixed(2);
  const ttcAfter = +(subtotalAfter + vatAfter).toFixed(2);
  const ship = computeShipping({
    mode: (process.env.SHIPPING_MODE||'flat'),
    flat: process.env.SHIPPING_FLAT,
    base: process.env.SHIPPING_BASE,
    perKg: process.env.SHIPPING_PER_KG,
    weightTotal: base.weightTotal
  });
  const grandTotal = +(ttcAfter + ship.amount).toFixed(2);

  // création commande
  const order = await models.Order.create({
    userId,
    totalTTC: grandTotal,
    currency: CURRENCY,
    status: process.env.FAKE_PAYMENTS === 'true' ? 'PAID' : 'PENDING',
    provider: process.env.FAKE_PAYMENTS === 'true' ? 'fake' : 'manual',
    shippingJson: shippingAddress ? JSON.stringify(shippingAddress) : null,
    billingJson: billingAddress ? JSON.stringify(billingAddress) : null
  });

  // items snapshot
  for (const it of items) {
    const snap = it.priceSnapshot || {};
    await models.OrderItem.create({
      orderId: order.id,
      productId: it.productId,
      title: snap.title || it.Product?.title || '',
      qty: it.qty,
      priceHT: snap.priceHT ?? it.Product?.priceHT ?? 0,
      tva: snap.tva ?? it.Product?.tva ?? 0
    });
    // décrémenter le stock
    if (it.Product) {
      it.Product.stock = Math.max(0, Number(it.Product.stock||0) - Number(it.qty||0));
      await it.Product.save();
    }
  }

  // vider le panier
  await models.CartItem.destroy({ where: { cartId: cart.id } });

  const clientSecret = process.env.FAKE_PAYMENTS === 'true' ? 'fake_client_secret' : null;
  res.json({ orderId: order.id, clientSecret, amount: grandTotal, currency: CURRENCY });
};

export const myOrders = async (req,res) => {
  const userId = req.user.id;
  const rows = await models.Order.findAll({
    where: { userId },
    order: [['createdAt','DESC']],
    include: [{ model: models.OrderItem }]
  });
  res.json(rows);
};

export const listAll = async (req,res) => {
  const rows = await models.Order.findAll({
    order: [['createdAt','DESC']],
    include: [{ model: models.OrderItem }, { model: models.User, attributes:['id','email'] }]
  });
  res.json(rows);
};

export const updateStatus = async (req,res) => {
  const { id } = req.params;
  const { status } = req.body||{};
  const order = await models.Order.findByPk(id);
  if (!order) return res.status(404).json({error:'Order not found'});
  order.status = status || order.status;
  await order.save();
  res.json(order);
};

export const exportPdf = async (req,res) => {
  const { id } = req.params;
  const order = await models.Order.findByPk(id, {
    include: [{ model: models.OrderItem }, { model: models.User, attributes:['email','id'] }]
  });
  if (!order) return res.status(404).json({error:'Order not found'});

  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${order.id}.pdf"`);

  const doc = new PDFDocument({ size:'A4', margin:50 });
  doc.pipe(res);

  doc.fontSize(18).text('FACTURE', { align:'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Commande #${order.id}`);
  doc.text(`Date: ${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}`);
  doc.text(`Client: ${order.User?.email || order.userId}`);

  doc.moveDown();
  doc.fontSize(12).text('Articles:');
  doc.moveDown(0.3);

  const headers = ['Qté','Désignation','PU HT','TVA %','Total TTC'];
  const colW = [40, 260, 80, 60, 100];
  const startX = 50; let y = doc.y;

  // header row
  doc.font('Helvetica-Bold');
  let x = startX;
  headers.forEach((h,i)=>{ doc.text(h, x, y); x += colW[i]; });
  doc.moveDown(0.8); y = doc.y; doc.font('Helvetica');

  let subtotalHT = 0, vatTotal = 0, totalTTC = 0;
  for (const it of order.OrderItems) {
    const lt = (()=>{
      const price = Number(it.priceHT)||0;
      const tva = Number(it.tva)||0;
      const q = Number(it.qty)||0;
      const ht = price*q;
      const vat = +(ht*tva/100);
      const ttc = +(ht+vat);
      subtotalHT += ht; vatTotal += vat; totalTTC += ttc;
      return {ht,vat,ttc};
    })();

    x = startX;
    doc.text(String(it.qty), x, y); x+=colW[0];
    doc.text(it.title || '', x, y, { width: colW[1] }); x+=colW[1];
    doc.text((+it.priceHT).toFixed(2), x, y); x+=colW[2];
    doc.text((+it.tva).toFixed(0), x, y); x+=colW[3];
    doc.text(lt.ttc.toFixed(2), x, y); 
    doc.moveDown(0.6); y = doc.y;
  }

  doc.moveDown();
  doc.text(`Sous-total HT: ${subtotalHT.toFixed(2)} ${CURRENCY}`);
  // (Optionnel: afficher la livraison si tu veux la recalculer/archiver)
  doc.text(`TVA: ${vatTotal.toFixed(2)} ${CURRENCY}`);
  doc.text(`Total TTC: ${totalTTC.toFixed(2)} ${CURRENCY}`, { underline:true });

  doc.end();
};
