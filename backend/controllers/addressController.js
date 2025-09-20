import { models } from '../models/index.js';

export async function list(req, res) {
  const rows = await models.Address.findAll({ where: { userId: req.user.id }, order: [['id','DESC']] });
  res.json(rows);
}

export async function create(req, res) {
  const { type='shipping', fullName, line1, line2, city, zip, country='FR', phone, isDefault=false } = req.body || {};
  if (!fullName || !line1 || !city || !zip) return res.status(400).json({ error: 'champs requis manquants' });
  if (isDefault) {
    await models.Address.update({ isDefault: false }, { where: { userId: req.user.id, type } });
  }
  const row = await models.Address.create({ userId: req.user.id, type, fullName, line1, line2, city, zip, country, phone, isDefault: !!isDefault });
  res.status(201).json(row);
}

export async function update(req, res) {
  const id = Number(req.params.id);
  const row = await models.Address.findOne({ where: { id, userId: req.user.id } });
  if (!row) return res.status(404).json({ error: 'Adresse introuvable' });
  const { type, fullName, line1, line2, city, zip, country, phone, isDefault } = req.body || {};
  if (typeof isDefault === 'boolean' && isDefault) {
    await models.Address.update({ isDefault: false }, { where: { userId: req.user.id, type: type || row.type } });
  }
  await row.update({ type: type ?? row.type, fullName, line1, line2, city, zip, country, phone, isDefault });
  res.json(row);
}

export async function remove(req, res) {
  const id = Number(req.params.id);
  const n = await models.Address.destroy({ where: { id, userId: req.user.id } });
  if (!n) return res.status(404).json({ error: 'Adresse introuvable' });
  res.json({ ok: true });
}
