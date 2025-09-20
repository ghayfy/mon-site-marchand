import express from 'express';
import cors from 'cors';

// ⚠️ ADAPTE ICI les chemins EXACTS trouvés à l'étape 1
import adminOrdersRoutes from './routes/adminOrders.js';
import adminCatalogRoutes from './routes/adminCatalog.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'backend', ts: Date.now() }));

// Monte sous /api si tes routers définissent déjà leurs sous-chemins internes
app.use('/api', adminOrdersRoutes);
app.use('/api', adminCatalogRoutes);

// 404 propre
app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });

// Erreurs
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API listening on http://0.0.0.0:${PORT}`));
