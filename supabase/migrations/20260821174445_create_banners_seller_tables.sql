/*
# Create banners, product_views, seller_products, seller_bank_accounts, returns, seller_videos tables

1. New Tables
- `banners` — admin-controlled home page carousel banners (title, subtitle, cta, image, gradient, display_order, active).
- `product_views` — tracks visitor views per product for seller analytics.
- `seller_products` — products created by sellers (title, description, price, images, category, stock, seller info).
- `seller_bank_accounts` — seller bank/UPI payout details.
- `returns` — return requests for orders (user + seller management).
- `seller_videos` — short video reels uploaded by sellers for product engagement.

2. Security
- All tables: RLS enabled.
- Banners: public read (anon+authenticated), public insert/update (admin panel uses anon key).
- Product views: public insert (tracking views), public read.
- Seller products: public read (shown in marketplace), public insert/update/delete (seller management).
- Seller bank accounts: public read/insert/update.
- Returns: public read/insert/update.
- Seller videos: public read/insert/update/delete.
- All use `TO anon, authenticated` since this app has no server-side admin auth gate.

3. Notes
- Banners have `display_order` for sorting and `active` flag to show/hide.
- Product views store a `product_id` and `viewed_at` timestamp for analytics graphing.
- Seller products store up to 5 image URLs in a text array.
*/

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT 'Shop Now',
  image text NOT NULL,
  gradient text NOT NULL DEFAULT 'from-flipkart-600 to-flipkart-800',
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_banners" ON banners;
CREATE POLICY "public_read_banners" ON banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_banners" ON banners;
CREATE POLICY "public_insert_banners" ON banners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_banners" ON banners;
CREATE POLICY "public_update_banners" ON banners FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_banners" ON banners;
CREATE POLICY "public_delete_banners" ON banners FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  seller_id text,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_product_views" ON product_views;
CREATE POLICY "public_insert_product_views" ON product_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_product_views" ON product_views;
CREATE POLICY "public_read_product_views" ON product_views FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);

CREATE TABLE IF NOT EXISTS seller_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text NOT NULL DEFAULT 'seller_default',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  mrp integer NOT NULL DEFAULT 0,
  discount integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'electronics',
  images text[] NOT NULL DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  brand text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'live',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_seller_products" ON seller_products;
CREATE POLICY "public_read_seller_products" ON seller_products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_seller_products" ON seller_products;
CREATE POLICY "public_insert_seller_products" ON seller_products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_seller_products" ON seller_products;
CREATE POLICY "public_update_seller_products" ON seller_products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_seller_products" ON seller_products;
CREATE POLICY "public_delete_seller_products" ON seller_products FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text NOT NULL DEFAULT 'seller_default',
  account_holder text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  bank_name text NOT NULL,
  upi_id text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_seller_bank" ON seller_bank_accounts;
CREATE POLICY "public_read_seller_bank" ON seller_bank_accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_seller_bank" ON seller_bank_accounts;
CREATE POLICY "public_insert_seller_bank" ON seller_bank_accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_seller_bank" ON seller_bank_accounts;
CREATE POLICY "public_update_seller_bank" ON seller_bank_accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_seller_bank" ON seller_bank_accounts;
CREATE POLICY "public_delete_seller_bank" ON seller_bank_accounts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  product_id text NOT NULL,
  product_title text NOT NULL,
  product_image text,
  customer_name text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_returns" ON returns;
CREATE POLICY "public_read_returns" ON returns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_returns" ON returns;
CREATE POLICY "public_insert_returns" ON returns FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_returns" ON returns;
CREATE POLICY "public_update_returns" ON returns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS seller_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id text NOT NULL DEFAULT 'seller_default',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  thumbnail text NOT NULL,
  product_id text,
  likes integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'live',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_seller_videos" ON seller_videos;
CREATE POLICY "public_read_seller_videos" ON seller_videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_seller_videos" ON seller_videos;
CREATE POLICY "public_insert_seller_videos" ON seller_videos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_seller_videos" ON seller_videos;
CREATE POLICY "public_update_seller_videos" ON seller_videos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_seller_videos" ON seller_videos;
CREATE POLICY "public_delete_seller_videos" ON seller_videos FOR DELETE
  TO anon, authenticated USING (true);
