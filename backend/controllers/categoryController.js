import { models } from '../models/index.js';
import toSlug from '../utils/slug.js';

export async function list(_req, res) {
  try {
    const rows = await models.Category.findAll({ order: [['id','DESC']] });
    res.json(rows);
  } catch (e) {
    console.error('Category.list error:', e);
    res.status(500).json({ error: 'Category list failed' });
  }
}

export async function create(req, res) {
  try {
    const { name, slug, active = true } = req.body || {};
    if (!name && !slug) return res.status(400).json({ error: 'name or slug required' });
    const s = (slug && String(slug).trim()) || toSlug(name);
    const row = await models.Category.create({ name: name || s, slug: s, active });
    res.status(201).json(row);
  } catch (e) {
    console.error('Category.create error:', e);
    // gestion contrainte unique éventuelle
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Category create failed' });
  }
}

export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await models.Category.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Category not found' });
    const { name, slug, active } = req.body || {};
    const patch = {};
    if (name) { patch.name = name; patch.slug = toSlug(name); }
    if (slug) { patch.slug = String(slug).trim() || row.slug; }
    if (typeof active === 'boolean') patch.active = active;
    await row.update(patch);
    res.json(row);
  } catch (e) {
    console.error('Category.update error:', e);
    res.status(500).json({ error: 'Category update failed' });
  }
}

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const n = await models.Category.destroy({ where: { id } });
    if (!n) return res.status(404).json({ error: 'Category not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Category.remove error:', e);
    res.status(500).json({ error: 'Category delete failed' });
  }
}
