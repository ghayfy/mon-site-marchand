// controllers/paypalController.js (ESM)
import paypal from '@paypal/checkout-server-sdk';

const mode = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();
const baseURL = mode === 'live' ? paypal.core.LiveEnvironment : paypal.core.SandboxEnvironment;
const env = new baseURL(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(env);

function paypalClient() { return client; }

export async function create(req, res, next) {
  try {
    const { amount = '19.90', currency = 'EUR' } = req.body || {};
    const r = new paypal.orders.OrdersCreateRequest();
    r.prefer('return=representation');
    r.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: String(amount) } }],
      application_context: {
        brand_name: 'Shop',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: process.env.PAYPAL_RETURN_URL,
        cancel_url: process.env.PAYPAL_CANCEL_URL
      }
    });
    const resp = await paypalClient().execute(r);
    const order = resp.result;
    const approve = (order.links || []).find(l => l.rel === 'approve')?.href;
    return res.status(200).json({ id: order.id, status: order.status, approve });
  } catch (err) {
    console.error('[PayPal][create] ERROR:', { statusCode: err?.statusCode, message: err?.message });
    next(err);
  }
}

export async function capture(req, res, next) {
  try {
    const orderId = req.params?.orderId || req.query?.orderId || req.query?.token || req.body?.orderId || req.body?.token;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const response = await paypalClient().execute(request);
    const result = response.result;

    // Best-effort: marquer payé si modèle Order dispo
    try {
      const mod = await import('../models/Order.js').catch(() => null);
      const Order = mod?.default || mod?.Order;
      if (Order?.update) {
        const cap = result?.purchase_units?.[0]?.payments?.captures?.slice(-1)?.[0];
        await Order.update(
          { status: 'PAID', paypalOrderId: result?.id, paypalCaptureId: cap?.id || null, paidAt: new Date() },
          { where: { paypalOrderId: result?.id } }
        );
      }
    } catch (e) { console.error('[DB] mark paid error:', e?.message || e); }

    return res.status(200).json({ id: result.id, status: result.status, result });
  } catch (err) {
    const raw = err?.result || {};
    const issue = raw?.details?.[0]?.issue;

    if (err?.statusCode === 422 && issue === 'ORDER_ALREADY_CAPTURED') {
      try {
        const getReq = new paypal.orders.OrdersGetRequest(
          req.params?.orderId || req.query?.orderId || req.query?.token || req.body?.orderId || req.body?.token
        );
        const getRes = await paypalClient().execute(getReq);
        const r = getRes.result;
        const lastCap = r?.purchase_units?.[0]?.payments?.captures?.slice(-1)?.[0];
        try {
          const mod = await import('../models/Order.js').catch(() => null);
          const Order = mod?.default || mod?.Order;
          if (Order?.update) {
            await Order.update(
              { status: 'PAID', paypalOrderId: r?.id, paypalCaptureId: lastCap?.id || null, paidAt: new Date() },
              { where: { paypalOrderId: r?.id } }
            );
          }
        } catch (e) { console.error('[DB] mark paid (idempotent) error:', e?.message || e); }

        return res.status(200).json({
          id: r?.id, status: r?.status, alreadyCaptured: true, captureId: lastCap?.id || null, result: r
        });
      } catch (e2) {
        console.error('[PayPal][capture][get] ERROR:', { statusCode: e2?.statusCode, message: e2?.message });
        return res.status(200).json({ id: req.params?.orderId, status: 'COMPLETED', alreadyCaptured: true });
      }
    }

    if (err?.statusCode === 422 && issue === 'ORDER_NOT_APPROVED') {
      return res.status(409).json({ error: 'ORDER_NOT_APPROVED', message: 'Order not approved by payer' });
    }

    console.error('[PayPal][capture] ERROR:', { statusCode: err?.statusCode, message: err?.message, result: raw || err?.result });
    return res.status(err?.statusCode || 502).json({ error: 'PayPal error', message: err?.message || 'capture failed' });
  }
}

export async function webhook(_req, res) {
  // TODO: valider signature si tu ajoutes le vrai webhook
  return res.sendStatus(200);
}

// Handler par défaut (non utilisé)
export default async function paypalController(_req, res) {
  return res.status(501).json({ error: 'PayPal non configuré (default handler)' });
}
