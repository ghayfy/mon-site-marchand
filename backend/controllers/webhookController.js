import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

import { Order, Cart, CartItem, Product } from '../models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('stripe.webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const orderId = Number(intent.metadata?.orderId);
      if (orderId) {
        await Order.update(
          { status: 'PAID' },
          { where: { id: orderId, provider: 'stripe' } }
        );

        // décrémenter le stock + vider le panier de l'utilisateur lié à la commande
        try {
          const order = await Order.findByPk(orderId);
          const userId = order?.user_id;
          if (userId) {
            const cart = await Cart.findOne({ where: { user_id: userId } });
            if (cart) {
              const items = await CartItem.findAll({ where: { cart_id: cart.id }, include: [{ model: Product, as: 'Product' }] });
              for (const it of items) {
                if (it.Product) {
                  const newStock = Math.max(0, Number(it.Product.stock) - Number(it.qty));
                  await it.Product.update({ stock: newStock });
                }
              }
              await CartItem.destroy({ where: { cart_id: cart.id } });
              await cart.update({ totals: { qty: 0, subtotalHT: 0, tva: 0, totalTTC: 0 } });
            }
          }
        } catch (noop) {
          console.warn('post-payment housekeeping warning:', noop.message);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const orderId = Number(intent.metadata?.orderId);
      if (orderId) {
        await Order.update(
          { status: 'FAILED' },
          { where: { id: orderId, provider: 'stripe' } }
        );
      }
    }

    return res.json({ received: true });
  } catch (e) {
    console.error('stripe.webhook handler error', e);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};
