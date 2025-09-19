import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

/* ===== Users & Addresses ===== */
export const User = sequelize.define("User", {
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  passHash: { type: DataTypes.STRING(255), allowNull: false, field: "pass_hash" },
  role: { type: DataTypes.ENUM("admin","client"), allowNull: false, defaultValue: "client" },
}, { tableName: "users" });

export const Address = sequelize.define("Address", {
  type: { type: DataTypes.ENUM("billing","shipping"), allowNull: false },
  nom: { type: DataTypes.STRING(120), allowNull: false },
  ligne1: { type: DataTypes.STRING(255), allowNull: false },
  ville: { type: DataTypes.STRING(120), allowNull: false },
  zip: { type: DataTypes.STRING(20), allowNull: false },
  pays: { type: DataTypes.STRING(2), allowNull: false },
  phone: { type: DataTypes.STRING(40) },
}, { tableName: "addresses" });

/* ===== Catalog ===== */
export const Category = sequelize.define("Category", {
  name: { type: DataTypes.STRING(120), allowNull: false },
  slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "categories" });

export const Product = sequelize.define("Product", {
  title: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  sku: { type: DataTypes.STRING(120), defaultValue: "" },
  priceHT: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "price_h_t" },
  tva: { type: DataTypes.DECIMAL(5,2), allowNull: false, defaultValue: 20.0 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  weight: { type: DataTypes.DECIMAL(10,3), defaultValue: 0 },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "products" });

export const ProductImage = sequelize.define("ProductImage", {
  url: { type: DataTypes.STRING(400), allowNull: false },
  alt: { type: DataTypes.STRING(200), defaultValue: "" },
}, { tableName: "product_images" });

/* ===== Orders ===== */
export const Order = sequelize.define("Order", {
  totalTTC: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "total_t_t_c", defaultValue: 0 },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "EUR" },
  status: { type: DataTypes.ENUM("PENDING","PAID","SHIPPED","CANCELLED"), defaultValue: "PENDING" },
  provider: { type: DataTypes.STRING(40), defaultValue: "fake" },
  shippingJson: { type: DataTypes.JSON, field: "shipping_json" },
  billingJson: { type: DataTypes.JSON, field: "billing_json" },
}, { tableName: "orders" });

export const OrderItem = sequelize.define("OrderItem", {
  title: { type: DataTypes.STRING(200), allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  priceHT: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "price_h_t" },
  tva: { type: DataTypes.DECIMAL(5,2), allowNull: false },
}, { tableName: "order_items" });

/* ===== Cart ===== */
export const Cart = sequelize.define("Cart", {
  totals: { type: DataTypes.JSON, defaultValue: { subtotalHT:0, tva:0, totalTTC:0, qty:0 } },
}, { tableName: "carts" });

export const CartItem = sequelize.define("CartItem", {
  qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  priceSnapshot: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "price_snapshot" },
}, { tableName: "cart_items" });

/* ===== Coupons (optionnel / promos) ===== */
export const Coupon = sequelize.define("Coupon", {
  code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  percentOff: { type: DataTypes.DECIMAL(5,2), allowNull: false, field: "percent_off" },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  startsAt: { type: DataTypes.DATE, field: "starts_at" },
  endsAt: { type: DataTypes.DATE, field: "ends_at" },
}, { tableName: "coupons" });

/* ===== Associations ===== */
User.hasMany(Address, { foreignKey: "user_id" });
Address.belongsTo(User, { foreignKey: "user_id" });

Category.hasMany(Product, { foreignKey: "category_id" });
Product.belongsTo(Category, { foreignKey: "category_id" });

Product.hasMany(ProductImage, { foreignKey: "product_id", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "product_id" });

User.hasMany(Order, { foreignKey: "user_id" });
Order.belongsTo(User, { foreignKey: "user_id" });

Order.hasMany(OrderItem, { foreignKey: "order_id" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });

User.hasOne(Cart, { foreignKey: "user_id" });
Cart.belongsTo(User, { foreignKey: "user_id" });

Cart.hasMany(CartItem, { foreignKey: "cart_id" });
CartItem.belongsTo(Cart, { foreignKey: "cart_id" });
CartItem.belongsTo(Product, { foreignKey: "product_id" });

export const models = { User, Address, Category, Product, ProductImage, Order, OrderItem, Cart, CartItem, Coupon };
export default models;
