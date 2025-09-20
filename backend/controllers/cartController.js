import { Cart, CartItem, Product } from "../models/index.js";

const includeProduct = {
  model: Product,
  attributes: ["id","title","slug","description","sku","priceHT","tva","stock","weight","active"]
};

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) cart = await Cart.create({ user_id: userId, totals: { subtotalHT:0, tva:0, totalTTC:0, qty:0 } });
  return cart;
}

function computeTotals(items) {
  let qty = 0, subtotalHT = 0, tva = 0;
  for (const it of items) {
    const q = Number(it.qty) || 0;
    const p = Number(it.priceSnapshot ?? it.Product?.priceHT ?? 0);
    const t = Number(it.Product?.tva ?? 0);
    qty += q;
    subtotalHT += p * q;
    tva += (p * q) * t / 100;
  }
  const totalTTC = subtotalHT + tva;
  return { qty, subtotalHT: +subtotalHT.toFixed(2), tva: +tva.toFixed(2), totalTTC: +totalTTC.toFixed(2) };
}

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const cart = await getOrCreateCart(userId);
    const items = await CartItem.findAll({ where: { cart_id: cart.id }, include: [includeProduct] });
    const totals = computeTotals(items);
    await cart.update({ totals });
    res.json({ id: cart.id, items, totals });
  } catch (e) { console.error("getCart error", e); next(e); }
};

export const addItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { productId, qty } = req.body;
    const cart = await getOrCreateCart(userId);

    const existing = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
    if (existing) {
      await existing.update({ qty: existing.qty + Number(qty || 1) });
    } else {
      // snapshot prix
      const prod = await Product.findByPk(productId);
      if (!prod) return res.status(400).json({ error: "Unknown product" });
      await CartItem.create({ cart_id: cart.id, product_id: productId, qty: Number(qty || 1), priceSnapshot: prod.priceHT });
    }
    const items = await CartItem.findAll({ where: { cart_id: cart.id }, include: [includeProduct] });
    const totals = computeTotals(items);
    await cart.update({ totals });
    res.json({ id: cart.id, items, totals });
  } catch (e) { console.error("addItem error", e); next(e); }
};

export const updateItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { productId, qty } = req.body;
    const cart = await getOrCreateCart(userId);
    const it = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
    if (!it) return res.status(404).json({ error: "Item not found" });
    await it.update({ qty: Number(qty || 1) });
    const items = await CartItem.findAll({ where: { cart_id: cart.id }, include: [includeProduct] });
    const totals = computeTotals(items);
    await cart.update({ totals });
    res.json({ id: cart.id, items, totals });
  } catch (e) { console.error("updateItem error", e); next(e); }
};

export const removeItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const productId = Number(req.params.productId);
    const cart = await getOrCreateCart(userId);
    await CartItem.destroy({ where: { cart_id: cart.id, product_id: productId } });
    const items = await CartItem.findAll({ where: { cart_id: cart.id }, include: [includeProduct] });
    const totals = computeTotals(items);
    await cart.update({ totals });
    res.json({ id: cart.id, items, totals });
  } catch (e) { console.error("removeItem error", e); next(e); }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const cart = await getOrCreateCart(userId);
    await CartItem.destroy({ where: { cart_id: cart.id } });
    const items = [];
    const totals = computeTotals(items);
    await cart.update({ totals });
    res.json({ id: cart.id, items, totals });
  } catch (e) { console.error("clearCart error", e); next(e); }
};
