import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  passHash: { type: DataTypes.STRING(255), allowNull: false, field: "pass_hash" },
  role: { type: DataTypes.ENUM("admin","client"), allowNull: false, defaultValue: "client" }
}, { tableName: "users" });
export default User;
