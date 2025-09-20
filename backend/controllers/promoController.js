import Promo from '../models/Promo.js';
export const list = async (req, res) => res.json(await Promo.findAll({ order: [['id','DESC']] }));
export const create = async (req, res) => {
  try { const p = await Promo.create(req.body); res.status(201).json(p); }
  catch (e) { res.status(400).json({ error: e.message }); }
};
export const update = async (req, res) => {
  const p = await Promo.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await p.update(req.body);
  res.json(p);
};
export const remove = async (req, res) => {
  const p = await Promo.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await p.destroy();
  res.json({ ok: true });
};
