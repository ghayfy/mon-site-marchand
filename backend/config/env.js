import dotenv from 'dotenv';
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  FRONT_ORIGIN: process.env.FRONT_ORIGIN ?? '*',
  PUBLIC_URL: process.env.PUBLIC_URL ?? 'http://localhost:5173',
  DB_HOST: process.env.DB_HOST ?? 'db',
  DB_USER: process.env.DB_USER ?? 'ecom',
  DB_PASS: process.env.DB_PASS ?? 'ecompass',
  DB_NAME: process.env.DB_NAME ?? 'ecomdb',
  DB_LOGGING: (process.env.DB_LOGGING ?? 'false') === 'true'
};

export default env;
