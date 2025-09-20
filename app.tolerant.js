import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck simple
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', ts: Date.now() });
});

// Tentatives d'import "douces" des routes admin.
// Si le fichier n'existe pas ou a un nom différent (casse/extension), on log un warning mais on ne crash pas.
let adminOrdersRoutes = null;
let adminCatalogRoutes = null;

try {
  adminOrdersRoutes = (await import('./routes/adminOrders.js')).default;
} catch (e) {
  console.warn('[WARN] adminOrders.js introuvable ou invalide:', e?.message);
}

try {
  adminCatalogRoutes = (await import('./routes/adminCatalog.js')).default;
} catch (e) {
  console.warn('[WARN] adminCatalog.js introuvable ou invalide:', e?.message);
}

// Monte les routes si disponibles (elles peuvent elles-mêmes contenir leur sous-chemin)
if (adminOrdersRoutes)  app.use('/api', adminOrdersRoutes);
if (adminCatalogRoutes) app.use('/api', adminCatalogRoutes);

// 404 propre (⚠️ pas de parenthèse en trop)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Handler d'erreurs
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
