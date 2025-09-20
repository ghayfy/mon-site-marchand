import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ecomdb',
  process.env.DB_USER || 'ecom',
  process.env.DB_PASS || 'ecompass',
  {
    host: process.env.DB_HOST || 'db',
    dialect: 'mysql',
    logging: (process.env.DB_LOGGING || 'false') === 'true' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: { max: 10, min: 0, acquire: 20000, idle: 10000 },
    retry: { max: 3 },
  }
);

// On expose les 2 formes pour ne rien casser ailleurs
export default sequelize;
export { sequelize, Sequelize };
