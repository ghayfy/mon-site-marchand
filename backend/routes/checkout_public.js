const express = require('express');
const router = express.Router();
router.post('/checkout', express.json(), (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const total = items.reduce((s, it) => s + (Number(it.price)||0) * (Number(it.qty)||1), 0);
  const orderId = Math.floor(Date.now() / 1000);
  try {
    const fs = require('fs');
    fs.writeFileSync('/tmp/checkout-last.json', JSON.stringify({at:new Date().toISOString(), ...req.body, orderId, total}, null, 2));
  } catch (_) {}
  return res.json({ ok: true, orderId, total });
});
module.exports = router;
