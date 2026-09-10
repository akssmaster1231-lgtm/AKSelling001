/*
# Create products and orders tables for AKSelling e-commerce app

1. New Tables
- `products` — stores all product catalog data (title, description, price, mrp, discount, category, images, rating, brand, delivery info, stock status).
- `orders` — stores placed orders with customer name, phone, address, items JSON, total amount, and order status.
- `order_items` — individual line items linked to an order for structured order data.

2. Security
- Enable RLS on all tables.
- Products: public read (anon + authenticated), no public write — products are managed server-side.
- Orders: public insert (anon + authenticated can place orders), public read (so customers can view their orders), no update/delete from anon.
- Order items: same pattern as orders.

3. Notes
- This is a single-tenant no-auth app (no sign-in screen), so policies use `TO anon, authenticated`.
- Products are seeded separately after migration.
- Orders store a `customer_name` and `customer_phone` for delivery since there is no auth.
*/

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  mrp integer NOT NULL,
  discount integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  rating numeric(2,1) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  brand text NOT NULL DEFAULT '',
  in_stock boolean NOT NULL DEFAULT true,
  delivery text NOT NULL DEFAULT 'Free delivery by tomorrow',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  total_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Placed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_orders" ON orders;
CREATE POLICY "public_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_title text NOT NULL,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_order_items" ON order_items;
CREATE POLICY "public_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_order_items" ON order_items;
CREATE POLICY "public_read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

-- Index for faster category queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
