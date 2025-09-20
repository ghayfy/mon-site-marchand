import { Product, ProductImage, Category } from '../models/index.js';

// Liste des produits (safe: pas de "createdAt", neutralise defaultScope)
export const list = async (req, res, next) => {
  try {
    const products = await Product.unscoped().findAll({
      include: [
        { model: ProductImage, as: 'images', attributes: ['id','url','alt'] },
        { model: Category, as: 'Category', attributes: ['id','name','slug'], required: false }
      ],
      order: [['created_at','DESC'], [{ model: ProductImage, as: 'images' }, 'id', 'ASC']]
    });

    // garder la clé "category" attendue par le front
    const out = products.map(p => {
      const j = p.toJSON();
      j.category = j.Category || null;
      delete j.Category;
      return j;
    });

    res.json(out);
  } catch (e) {
    console.error('Product.list error', e);
    res.status(500).json({ error: 'Product list failed', detail: e?.parent?.sqlMessage || e.message });
  }
};

// Stubs pour éviter tout crash si les routes importent ces handlers :
export const get = async (req, res) => res.status(501).json({ error: 'Not implemented' });
export const create = async (req, res) => res.status(501).json({ error: 'Not implemented' });
export const update = async (req, res) => res.status(501).json({ error: 'Not implemented' });
export const remove = async (req, res) => res.status(501).json({ error: 'Not implemented' });
export const uploadImage = async (req, res) => res.status(501).json({ error: 'Not implemented' });

export const getOne = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id ?? req.params.slug ?? req.params.idOrSlug;
    const where = /^\d+$/.test(String(idOrSlug)) ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) };

    const p = await Product.unscoped().findOne({
      where,
      include: [
        { model: ProductImage, as: 'images', attributes: ['id', 'url', 'alt'] },
        { model: Category, as: 'Category', attributes: ['id', 'name', 'slug'], required: false }
      ],
      order: [[{ model: ProductImage, as: 'images' }, 'id', 'ASC']]
    });

    if (!p) return res.status(404).json({ error: 'Not found' });

    const j = p.toJSON();
    j.category = j.Category || null; // clé attendue par le front
    delete j.Category;

    return res.json(j);
  } catch (e) {
    console.error('Product.getOne error', e);
    return res.status(500).json({ error: 'Product getOne failed', detail: e?.parent?.sqlMessage || e.message });
  }
};
