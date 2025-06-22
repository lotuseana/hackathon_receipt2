-- Update existing database to support user authentication and personalized data

-- Add user_id column to existing categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate categories per user (with error handling)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_category'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT unique_user_category UNIQUE(user_id, name);
    END IF;
END $$;

-- Enable Row Level Security on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create policies to allow users to only access their own categories
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create default categories for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, total_spent)
  VALUES 
    (NEW.id, 'Food and Drink', 0.00),
    (NEW.id, 'Clothing', 0.00),
    (NEW.id, 'Utilities', 0.00),
    (NEW.id, 'Entertainment', 0.00),
    (NEW.id, 'Other', 0.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create default categories when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Optional: Clean up orphaned categories (recommended)
DELETE FROM public.categories WHERE user_id IS NULL;

-- Optional: Migrate existing data (if you want to keep existing categories for a default user)
-- This creates a default user and assigns existing categories to them
-- Uncomment the following lines if you want to preserve existing data:

/*
-- Create a default user (you'll need to replace 'default@example.com' with a real email)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'default@example.com',
  crypt('defaultpassword', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Get the default user ID
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  SELECT id INTO default_user_id FROM auth.users WHERE email = 'default@example.com' LIMIT 1;
  
  -- Update existing categories to belong to the default user
  UPDATE categories SET user_id = default_user_id WHERE user_id IS NULL;
END $$;
*/ 