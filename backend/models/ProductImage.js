import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const ProductImage = sequelize.define("ProductImage", {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  url: { type: DataTypes.STRING(255), allowNull: false },
  alt: { type: DataTypes.STRING(190), allowNull: true }
}, { tableName: "product_images" });
export default ProductImage;
