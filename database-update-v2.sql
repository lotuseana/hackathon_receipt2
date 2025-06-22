-- Create spending_items table to log individual spending entries
CREATE TABLE IF NOT EXISTS spending_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on spending_items table
ALTER TABLE spending_items ENABLE ROW LEVEL SECURITY;

-- Create policies for spending_items table
CREATE POLICY "Users can view their own spending items" ON spending_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending items" ON spending_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending items" ON spending_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spending items" ON spending_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for spending_items table
CREATE INDEX IF NOT EXISTS idx_spending_items_user_id ON spending_items(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_items_category_id ON spending_items(category_id); 