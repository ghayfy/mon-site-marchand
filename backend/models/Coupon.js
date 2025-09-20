export default (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    percentOff: { type: DataTypes.DECIMAL(5,2), allowNull: true },
    amountOff: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    minSubtotal: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    maxRedemptions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    timesRedeemed: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, { tableName: 'coupons', underscored: true });
  return Coupon;
};
