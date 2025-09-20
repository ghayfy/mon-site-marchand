import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: { type: DataTypes.STRING(190), allowNull: false },
  slug: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  sku: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "" },
  priceHT: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "price_h_t" },
  tva: { type: DataTypes.DECIMAL(5,2), allowNull: false, defaultValue: 20 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  weight: { type: DataTypes.DECIMAL(10,3), allowNull: true },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: "products" });
export default Product;
