import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const Order = sequelize.define("Order", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  totalTTC: { type: DataTypes.DECIMAL(10,2), allowNull: false, field: "total_t_t_c" },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "EUR" },
  status: { type: DataTypes.ENUM("PENDING","PAID","CANCELLED","SHIPPED"), allowNull: false, defaultValue: "PENDING" },
  provider: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "fake" },
  shippingJson: { type: DataTypes.JSON, field: "shipping_json" },
  billingJson: { type: DataTypes.JSON, field: "billing_json" }
}, { tableName: "orders" });
export default Order;
