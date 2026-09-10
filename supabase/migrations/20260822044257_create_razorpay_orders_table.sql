/*
# Create razorpay_orders table for payment tracking

1. New Tables
- `razorpay_orders`
  - `id` (uuid, primary key)
  - `razorpay_order_id` (text, unique) - order ID from Razorpay
  - `amount` (integer, not null) - amount in paise
  - `currency` (text, default INR)
  - `status` (text, default created) - created/paid/failed
  - `razorpay_payment_id` (text, nullable) - payment ID on success
  - `razorpay_signature` (text, nullable) - signature for verification
  - `order_ref` (uuid, nullable) - reference to internal orders table
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on `razorpay_orders`.
- Allow anon + authenticated CRUD for payment flow.
*/

CREATE TABLE IF NOT EXISTS razorpay_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id text UNIQUE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  razorpay_payment_id text,
  razorpay_signature text,
  order_ref uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE razorpay_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_razorpay_orders" ON razorpay_orders;
CREATE POLICY "anon_insert_razorpay_orders" ON razorpay_orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_razorpay_orders" ON razorpay_orders;
CREATE POLICY "anon_select_razorpay_orders" ON razorpay_orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_razorpay_orders" ON razorpay_orders;
CREATE POLICY "anon_update_razorpay_orders" ON razorpay_orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
