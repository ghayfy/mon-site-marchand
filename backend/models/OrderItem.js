import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const OrderItem = sequelize.define("OrderItem", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: { type: DataTypes.STRING(190), allowNull: false },
  qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  priceHT: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "price_h_t" },
  tva: { type: DataTypes.DECIMAL(5,2), allowNull: false, defaultValue: 20 }
}, { tableName: "order_items" });
export default OrderItem;
