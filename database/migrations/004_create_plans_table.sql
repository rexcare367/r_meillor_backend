-- Plans table stores pricing tiers synced with Stripe products/prices
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- amount in minor units (e.g. cents)
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month',
  interval_count INTEGER NOT NULL DEFAULT 1,
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_price ON plans(amount);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are readable by everyone"
  ON plans
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Only service roles can modify plans"
  ON plans
  USING (current_setting('request.jwt.claim.role', true) = 'service_role')
  WITH CHECK (current_setting('request.jwt.claim.role', true) = 'service_role');

COMMENT ON TABLE plans IS 'Membership plans managed via Stripe products & prices';
COMMENT ON COLUMN plans.amount IS 'Price in smallest currency unit (e.g. cents)';
COMMENT ON COLUMN plans.interval IS 'Billing interval (day, week, month, year)';

