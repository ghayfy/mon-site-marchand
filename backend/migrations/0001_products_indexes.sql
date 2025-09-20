CREATE TABLE IF NOT EXISTS _schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at DATETIME NOT NULL
);
SET @have := (SELECT COUNT(1)
              FROM information_schema.statistics
              WHERE table_schema = DATABASE()
                AND table_name = 'products'
                AND index_name = 'uniq_products_slug');
SET @sql := IF(@have = 0,
               'ALTER TABLE products ADD UNIQUE KEY uniq_products_slug (slug);',
               'SELECT 1;');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
INSERT INTO _schema_migrations (name, applied_at)
SELECT '0001_products_indexes.sql', NOW()
WHERE NOT EXISTS (SELECT 1 FROM _schema_migrations WHERE name = '0001_products_indexes.sql');
