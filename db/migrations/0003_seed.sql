INSERT IGNORE INTO categories (id,name,slug) VALUES
 (1,'Textile','textile'),
 (2,'Objets','objets');

INSERT INTO products (id,title,slug,description,sku,price_h_t,tva,stock,active,category_id)
VALUES
 (1,'Tee-shirt blanc','tee-shirt-blanc','100% coton','TS-BLANC',9.99,20,100,1,1),
 (2,'Mug logo','mug-logo','Céramique','MUG-LOGO',7.50,20,200,1,2),
 (5,'Sac coton','sac-coton','Tote bag 140g','TOTE-140',3.90,20,500,1,2),
 (6,'Casquette noire','casquette-noire','Coton brossé','CAP-BLK',12.50,20,150,1,1)
ON DUPLICATE KEY UPDATE
 title=VALUES(title), slug=VALUES(slug), description=VALUES(description),
 sku=VALUES(sku), price_h_t=VALUES(price_h_t), tva=VALUES(tva),
 stock=VALUES(stock), active=VALUES(active), category_id=VALUES(category_id);
