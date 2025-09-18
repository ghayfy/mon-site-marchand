import { Router } from 'express';
import paypal from 'paypal-rest-sdk';
const r = Router();
  try {
    const { amount, currency='eur' } = req.body;
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID || '',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || ''
});
r.post('/paypal/create-order', (req, res) => {
  const { total='0.01', currency='EUR' } = req.body;
  const create_payment_json = {
    intent: "sale",
    payer: { payment_method: "paypal" },
    redirect_urls: { return_url: "http://localhost:5173/success", cancel_url: "http://localhost:5173/cancel" },
    transactions: [{ amount: { currency, total }, description: "Order" }]
  };
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) { return res.status(400).json({ error: error.response }); }
    const approval = payment.links.find(l => l.rel === 'approval_url')?.href;
    res.json({ id: payment.id, approval });
  });
});
export default r;
