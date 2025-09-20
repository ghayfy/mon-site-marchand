import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Address = sequelize.define("Address", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type: { type: DataTypes.ENUM("billing","shipping"), allowNull: false, defaultValue: "shipping" },
  fullName: { type: DataTypes.STRING(190), allowNull: false, field: "full_name" },
  line1: { type: DataTypes.STRING(190), allowNull: false },
  city: { type: DataTypes.STRING(120), allowNull: false },
  zip: { type: DataTypes.STRING(24), allowNull: false },
  country: { type: DataTypes.STRING(2), allowNull: false },
  phone: { type: DataTypes.STRING(32) }
}, { tableName: "addresses" });

export default Address;
