import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const Category = sequelize.define("Category", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(190), allowNull: false },
  slug: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: "categories" });
export default Category;
