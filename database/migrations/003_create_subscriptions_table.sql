-- Create subscriptions table to manage user memberships
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_url TEXT,
  pause_reason TEXT,
  cancel_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_event_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- Enable Row Level Security so policies can protect data when using anon keys
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions (covers manual tear down)
CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE subscriptions IS 'Stores user membership subscriptions and lifecycle metadata';
COMMENT ON COLUMN subscriptions.user_id IS 'References users.id (Supabase public.users table)';
COMMENT ON COLUMN subscriptions.plan IS 'Identifier for the purchased plan or membership tier';
COMMENT ON COLUMN subscriptions.status IS 'Lifecycle status such as active, paused, canceled';

