import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

import { Cart, CartItem, Product, Order } from '../models/index.js';

// Calcule total TTC (en centimes) à partir du panier + port flat (env)
function computeAmountCents(cart) {
  const subtotalHT = cart.items.reduce((sum, it) => {
    const priceHT = Number(it.priceSnapshot ?? it.Product?.priceHT ?? 0);
    return sum + priceHT * Number(it.qty);
  }, 0);

  const VAT_RATE = Number(process.env.VAT_RATE ?? 0.20);
  const SHIPPING_MODE = process.env.SHIPPING_MODE ?? 'flat';
  const SHIPPING_FLAT = Number(process.env.SHIPPING_FLAT ?? 4.9);
  const currency = (process.env.CURRENCY ?? 'EUR').toLowerCase();

  const shipping = SHIPPING_MODE === 'flat' ? SHIPPING_FLAT : 0;
  const tva = Number((subtotalHT * VAT_RATE).toFixed(2));
  const totalTTC = Number((subtotalHT + tva + shipping).toFixed(2));
  return { amountCents: Math.round(totalTTC * 100), totalTTC, currency, shipping, tva, subtotalHT };
}

// récupère ou crée un panier pour l’utilisateur, avec ses items
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) cart = await Cart.create({ user_id: userId, totals: { qty: 0, subtotalHT: 0, tva: 0, totalTTC: 0 } });
  const items = await CartItem.findAll({
    where: { cart_id: cart.id },
    include: [{ model: Product, as: 'Product' }]
  });
  cart.items = items;
  return cart;
}

export const createIntent = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const shippingAddress = req.body?.shippingAddress ?? {};
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    // Charger le panier
    const cart = await getOrCreateCart(userId);
    if (!cart.items?.length) return res.status(400).json({ error: 'Panier vide' });

    // Montant
    const { amountCents, totalTTC, currency } = computeAmountCents(cart);

    // Créer une Order en statut PENDING (provider=stripe)
    const order = await Order.create({
      user_id: userId,
      totalTTC: totalTTC.toFixed(2),
      currency: currency.toUpperCase(),
      status: 'PENDING',
      provider: 'stripe',
      shippingJson: shippingAddress,
      billingJson: {}
    });

    // Créer le PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        orderId: String(order.id),
        userId: String(userId)
      },
      automatic_payment_methods: { enabled: true }
    });

    // Renvoyer clientSecret & orderId
    return res.json({ clientSecret: pi.client_secret, orderId: order.id, amount: amountCents, currency: currency.toUpperCase() });
  } catch (e) {
    console.error('stripe.createIntent error', e);
    return res.status(500).json({ error: 'Stripe createIntent failed', detail: e.message });
  }
};
