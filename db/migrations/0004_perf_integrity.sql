-- Index produits + cohérence
ALTER TABLE products
  ADD INDEX IF NOT EXISTS idx_products_sku (sku),
  ADD INDEX IF NOT EXISTS idx_products_title (title);

-- Index images
ALTER TABLE product_images
  ADD INDEX IF NOT EXISTS idx_images_product (product_id);

-- Index commandes
ALTER TABLE orders
  ADD INDEX IF NOT EXISTS idx_orders_status_created (status, created_at);

ALTER TABLE order_items
  ADD INDEX IF NOT EXISTS idx_items_order (order_id),
  ADD INDEX IF NOT EXISTS idx_items_product (product_id);
