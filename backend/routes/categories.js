import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { list, create, update, remove } from '../controllers/categoryController.js';

const r = Router();
r.get('/', list); // public
r.post('/', requireAuth(['admin']), create);
r.put('/:id', requireAuth(['admin']), update);
r.delete('/:id', requireAuth(['admin']), remove);
export default r;

/** Création idempotente par slug (renvoie 200 si déjà existant) */
r.post('/upsert', requireAuth(['admin']), async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const slug = (await import('../utils/slug.js')).default(name);
    const [row, created] = await (await import('../models/index.js')).models.Category.findOrCreate({
      where: { slug },
      defaults: { name, slug, active: true }
    });
    res.status(created ? 201 : 200).json(row);
  } catch (e) {
    console.error('Category.upsert error:', e);
    res.status(500).json({ error: 'Category upsert failed' });
  }
});
