import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const MIG_DIR = path.resolve(__dirname, '..', 'migrations');
(async () => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'db',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASS || 'app',
    database: process.env.DB_NAME || 'monshop',
    multipleStatements: true,
    waitForConnections: true,
  });
  await pool.query('CREATE TABLE IF NOT EXISTS _schema_migrations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, applied_at DATETIME NOT NULL)');
  const [applied] = await pool.query('SELECT name FROM _schema_migrations');
  const done = new Set(applied.map(r => r.name));
  const files = fs.readdirSync(MIG_DIR).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = fs.readFileSync(path.join(MIG_DIR, f), 'utf8');
    await pool.query(sql);
  }
  await pool.end();
  process.exit(0);
})().catch(e => { console.error('Migration error:', e); process.exit(1); });
