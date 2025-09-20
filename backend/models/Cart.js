import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Cart = sequelize.define("Cart", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  totals: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
}, { tableName: "carts", underscored: true });

export default Cart;
