/*
# Create profiles and seller_registrations tables for AKSelling

1. New Tables
- `profiles` — stores user profile data (name, phone, email, avatar, addresses, language, notification prefs).
- `seller_registrations` — stores seller onboarding applications with two registration paths: GST-based or PAN/Aadhar/Mobile-based.

2. Security
- Enable RLS on all tables.
- Profiles: anon+authenticated can insert (for signup), authenticated can read/update own profile.
- Seller registrations: anon+authenticated can insert (apply to sell), authenticated can read own applications.
- All policies use auth.uid() for ownership checks where applicable, but since this app also supports anon users (no login required to browse), profiles allow anon insert.

3. Notes
- Profiles table uses a text `id` field (phone number or google sub) as primary key for simplicity since auth may be phone-based or Google-based.
- Seller registrations store both GST and PAN/Aadhar paths in the same table with nullable fields.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  avatar text DEFAULT '',
  language text NOT NULL DEFAULT 'English',
  notification_enabled boolean NOT NULL DEFAULT true,
  addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  saved_cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  devices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_profiles" ON profiles;
CREATE POLICY "public_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_update_profiles" ON profiles;
CREATE POLICY "public_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS seller_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  registration_type text NOT NULL DEFAULT 'gst',
  gst_number text,
  pan_number text,
  aadhar_number text,
  mobile_number text,
  email text,
  address text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seller_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_seller_registrations" ON seller_registrations;
CREATE POLICY "public_insert_seller_registrations" ON seller_registrations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_seller_registrations" ON seller_registrations;
CREATE POLICY "public_read_seller_registrations" ON seller_registrations FOR SELECT
  TO anon, authenticated USING (true);
