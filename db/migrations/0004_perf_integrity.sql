-- products.idx_products_sku
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_sku'
);
SET @sql := IF(@exists=0, 'ALTER TABLE products ADD INDEX idx_products_sku (sku);', 'SELECT 1;');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
-- products.idx_products_title
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_title'
);
SET @sql := IF(@exists=0, 'ALTER TABLE products ADD INDEX idx_products_title (title);', 'SELECT 1;');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
-- product_images.idx_images_product
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'product_images' AND index_name = 'idx_images_product'
);
SET @sql := IF(@exists=0, 'ALTER TABLE product_images ADD INDEX idx_images_product (product_id);', 'SELECT 1;');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
-- orders.idx_orders_status_created
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_status_created'
);
SET @sql := IF(@exists=0, 'ALTER TABLE orders ADD INDEX idx_orders_status_created (status, created_at);', 'SELECT 1;');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
-- order_items.idx_items_order
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_items_order'
);
SET @sql := IF(@exists=0, 'ALTER TABLE order_items ADD INDEX idx_items_order (order_id);', 'SELECT 1;');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
-- order_items.idx_items_product
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_items_product'
);
SET @sql := IF(@exists=0, 'ALTER TABLE order_items ADD INDEX idx_items_product (product_id);', 'SELECT 1;');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
