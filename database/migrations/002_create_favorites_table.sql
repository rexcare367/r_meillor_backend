-- Create favorites table for storing user favorite coins
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  coin_id UUID NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only favorite a coin once
  UNIQUE(user_id, coin_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_coin_id ON favorites(coin_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_coin ON favorites(user_id, coin_id);

-- Enable Row Level Security (RLS)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE favorites IS 'Stores user favorite coins';
COMMENT ON COLUMN favorites.user_id IS 'References the user from Supabase auth.users';
COMMENT ON COLUMN favorites.coin_id IS 'References the coin from coins table';

