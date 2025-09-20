export function lineTotals(priceHT, tva, qty=1) {
  const pHT = Number(priceHT)||0;
  const t = Number(tva)||0;
  const q = Number(qty)||0;
  const ht = pHT * q;
  const vat = +(ht * t/100);
  const ttc = +(ht + vat);
  return {ht:+ht.toFixed(2), vat:+vat.toFixed(2), ttc:+ttc.toFixed(2)};
}

export function cartTotals(items=[]) {
  let subtotalHT=0, vat=0, totalTTC=0, weightTotal=0;
  for (const it of items) {
    const snap = it.priceSnapshot || {};
    const pHT = Number(snap.priceHT ?? it.Product?.priceHT ?? 0);
    const tva = Number(snap.tva ?? it.Product?.tva ?? 0);
    const qty = Number(it.qty||0);
    const w = Number(it.Product?.weight ?? snap.weight ?? 0);
    const lt = lineTotals(pHT, tva, qty);
    subtotalHT += lt.ht; vat += lt.vat; totalTTC += lt.ttc;
    weightTotal += w * qty;
  }
  return {
    subtotalHT:+subtotalHT.toFixed(2),
    vat:+vat.toFixed(2),
    totalTTC:+totalTTC.toFixed(2),
    weightTotal:+weightTotal.toFixed(3)
  };
}

export function applyCouponBeforeTax(subtotalHT, coupon) {
  if (!coupon) return {discountHT:0, subtotalAfter: +subtotalHT.toFixed(2)};
  let discountHT = 0;
  if (coupon.percentOff) discountHT = subtotalHT * (Number(coupon.percentOff)||0)/100;
  if (coupon.amountOff) discountHT += Number(coupon.amountOff)||0;
  discountHT = Math.min(discountHT, subtotalHT);
  return {discountHT:+discountHT.toFixed(2), subtotalAfter:+(subtotalHT-discountHT).toFixed(2)};
}
