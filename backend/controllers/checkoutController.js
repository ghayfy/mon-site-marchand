import { models } from '../models/index.js';
import { computeTotalsFromItems } from '../services/pricingService.js';

const includeProduct = { model: models.Product };

async function getCartWithItems(userId) {
  const cart = await models.Cart.findOne({ where: { user_id: userId } });
  if (!cart) return { cart: null, items: [] };
  const items = await models.CartItem.findAll({
    where: { cart_id: cart.id },
    include: [includeProduct],
  });
  return { cart, items };
}

export const quote = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { items } = await getCartWithItems(userId);
    if (!items.length) return res.status(400).json({ error: 'Panier vide' });

    const totals = computeTotalsFromItems(items);
    res.json(totals);
  } catch (e) { console.error('quote error', e); next(e); }
};

export const createIntent = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { cart, items } = await getCartWithItems(userId);
    if (!cart || !items.length) return res.status(400).json({ error: 'Panier vide' });

    const totals = computeTotalsFromItems(items);

    // Création commande
    const order = await models.Order.create({
      user_id: userId,                 // attribut snake_case utilisé partout ailleurs
      totalTTC: totals.totalTTC,       // champ modèle côté JS (mappé en snake en DB si underscored)
      currency: totals.currency,
      status: 'PAID',                  // provider "fake"
      provider: 'fake',
      shippingJson: req.body?.shippingAddress ?? {},
      billingJson: req.body?.billingAddress ?? {},
    });

    // Items de la commande + décrément stock basique
    for (const it of items) {
      const pid = it.product_id ?? it.Product?.id;
      await models.OrderItem.create({
        order_id: order.id,
        product_id: pid,
        title: it.Product?.title ?? '',
        qty: it.qty,
        priceHT: it.priceSnapshot ?? it.Product?.priceHT ?? 0,
        tva: it.Product?.tva ?? 20,
      });
      if (it.Product && typeof it.Product.decrement === 'function') {
        await it.Product.decrement('stock', { by: it.qty });
      }
    }

    // Vider le panier
    await models.CartItem.destroy({ where: { cart_id: cart.id } });

    // Réponse type "paiement"
    res.json({
      orderId: order.id,
      clientSecret: 'fake_client_secret',
      amount: Math.round(totals.totalTTC * 100),
      currency: totals.currency,
    });
  } catch (e) { console.error('createIntent error', e); next(e); }
};

export const myOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await models.Order.findAll({ where: { user_id: userId } });
    res.json(orders);
  } catch (e) { console.error('myOrders error', e); next(e); }
};
