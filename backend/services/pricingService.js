export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function computeTotalsFromItems(items) {
  const VAT_RATE = Number(process.env.VAT_RATE ?? 0.20);
  const SHIPPING_MODE = process.env.SHIPPING_MODE ?? 'flat';
  const SHIPPING_FLAT = Number(process.env.SHIPPING_FLAT ?? 4.9);
  const CURRENCY = process.env.CURRENCY ?? 'EUR';

  const subtotalHT = round2(items.reduce((s, it) => {
    const price = Number(it.priceSnapshot ?? it.Product?.priceHT ?? 0);
    return s + price * Number(it.qty ?? 0);
  }, 0));

  const qty = items.reduce((s, it) => s + Number(it.qty ?? 0), 0);

  // Simple: port forfaitaire ou 0 (brackets possibles plus tard)
  const shipping = SHIPPING_MODE === 'flat' ? SHIPPING_FLAT : 0;

  // TVA uniquement sur le HT produits (pas le port)
  const vat = round2(subtotalHT * VAT_RATE);

  const totalTTC = round2(subtotalHT + shipping + vat);

  return { qty, subtotalHT, shipping, vat, totalTTC, currency: CURRENCY };
}
