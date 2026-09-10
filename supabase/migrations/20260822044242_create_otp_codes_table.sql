/*
# Create OTP codes table for Twilio SMS verification

1. New Tables
- `otp_codes`
  - `id` (uuid, primary key)
  - `phone` (text, not null) - the phone number OTP was sent to
  - `code` (text, not null) - the 6-digit OTP code
  - `expires_at` (timestamptz, not null) - when the OTP expires (5 minutes)
  - `verified` (boolean, default false) - whether this OTP was used
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on `otp_codes`.
- Allow anon + authenticated CRUD for OTP send/verify flow.
*/

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_otp" ON otp_codes;
CREATE POLICY "anon_insert_otp" ON otp_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_otp" ON otp_codes;
CREATE POLICY "anon_select_otp" ON otp_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_otp" ON otp_codes;
CREATE POLICY "anon_update_otp" ON otp_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_otp" ON otp_codes;
CREATE POLICY "anon_delete_otp" ON otp_codes FOR DELETE
  TO anon, authenticated USING (true);
