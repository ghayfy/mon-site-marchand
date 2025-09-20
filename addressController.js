cat > backend/controllers/addressController.js <<'EOF'
import Address from '../models/Address.js';

export const list = async (req, res) => {
  const items = await Address.findAll({ where: { userId: req.user.id }, order: [['isDefault','DESC'],['id','DESC']] });
  res.json(items);
};

export const create = async (req, res) => {
  const a = await Address.create({ ...req.body, userId: req.user.id });
  res.status(201).json(a);
};

export const update = async (req, res) => {
  const a = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!a) return res.status(404).json({ error: 'Not found' });
  await a.update(req.body);
  res.json(a);
};

export const remove = async (req, res) => {
  const a = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!a) return res.status(404).json({ error: 'Not found' });
  await a.destroy();
  res.json({ ok: true });
};

export const setDefault = async (req, res) => {
  const id = req.params.id;
  await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
  const a = await Address.findOne({ where: { id, userId: req.user.id } });
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.isDefault = true; await a.save();
  res.json(a);
};
EOF
