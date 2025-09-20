import { models } from '../models/index.js';

function now() { return new Date(); }
function toNumber(x, d=2) { if (x == null) return 0; return Number.parseFloat(Number(x).toFixed(d)); }

export async function list(_req, res) {
  const rows = await models.Coupon.findAll({ order: [['id','DESC']] });
  res.json(rows);
}
export async function create(req, res) {
  const row = await models.Coupon.create(req.body || {});
  res.status(201).json(row);
}
export async function update(req, res) {
  const id = Number(req.params.id);
  const row = await models.Coupon.findByPk(id);
  if (!row) return res.status(404).json({ error: 'Coupon not found' });
  await row.update(req.body || {});
  res.json(row);
}
export async function remove(req, res) {
  const id = Number(req.params.id);
  const n = await models.Coupon.destroy({ where: { id } });
  if (!n) return res.status(404).json({ error: 'Coupon not found' });
  res.json({ ok: true });
}
export async function validate(req, res) {
  const { code, subtotal } = req.body || {};
  const s = Number(subtotal || 0);
  const c = await models.Coupon.findOne({ where: { code, active: true } });
  if (!c) return res.json({ valid: false, message: 'Code invalide' });

  const nowDt = now();
  if (c.startsAt && nowDt < c.startsAt) return res.json({ valid: false, message: 'Code non actif' });
  if (c.endsAt && nowDt > c.endsAt) return res.json({ valid: false, message: 'Code expiré' });
  if (c.minSubtotal && s < Number(c.minSubtotal)) return res.json({ valid: false, message: 'Montant minimum non atteint' });
  if (c.maxRedemptions && c.timesRedeemed >= c.maxRedemptions) return res.json({ valid: false, message: 'Quota atteint' });

  let discount = 0;
  if (c.percentOff) discount = s * (Number(c.percentOff)/100);
  else if (c.amountOff) discount = Number(c.amountOff);
  discount = Math.min(discount, s);

  res.json({ valid: true, code: c.code, percentOff: c.percentOff, amountOff: c.amountOff, discount: toNumber(discount) });
}
