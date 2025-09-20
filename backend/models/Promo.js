import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
const Promo = sequelize.define('Promo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('percentage','fixed'), allowNull: false, defaultValue: 'percentage' },
  value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  startsAt: { type: DataTypes.DATE, allowNull: true },
  endsAt: { type: DataTypes.DATE, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'promos' });
export default Promo;
