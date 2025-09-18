import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/db.js';

import authRoutes from './routes/auth.js';
import addressesRoutes from './routes/addresses.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import couponsRoutes from './routes/coupons.js';
import cartRoutes from './routes/cart.js';
import checkoutRoutes from './routes/checkout.js';
import paypalRoutes from './routes/paypal.js';

const app = express();
app.use(cors());
app.options('*', cors());
app.options('*', cors());
app.use(express.json());
app.use("/api/paypal", paypalRoutes);
// logger propre
app.use((req,res,next)=>{const t=Date.now();res.on('finish',()=>{console.log()});next();});
app.use(express.urlencoded({ extended: true }));app.use('/uploads', express.static('uploads'));

app.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', service: 'ecommerce-api', db: 'ok' });
  } catch {
    res.status(500).json({ status: 'error', service: 'ecommerce-api', db: 'down' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);

// PayPal

import adminCatalogRoutes from "./routes/adminCatalog.js";
import adminOrdersRoutes  from "./routes/adminOrders.js";

app.use(adminCatalogRoutes);
app.use(adminOrdersRoutes);
// __ADMIN_ROUTES_INSERTED__
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  try {
    await sequelize.sync();
    console.log(`API listening on http://0.0.0.0:${PORT}`);
  } catch (e) {
    console.error('DB boot error:', e?.message || e);
    process.exit(1);
  }
});
