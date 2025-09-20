import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CartItem = sequelize.define("CartItem", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  cart_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  price_snapshot: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 }
}, {
  tableName: "cart_items",
  underscored: true,
  indexes: [{ unique: true, fields: ["cart_id", "product_id"] }]
});

export default CartItem;
