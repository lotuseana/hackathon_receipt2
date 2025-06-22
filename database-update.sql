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

-- Create budgets table for smart budget tracking
-- Note: Using BIGINT for category_id to match the categories table id type
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  budget_type VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (budget_type IN ('weekly', 'monthly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, budget_type)
);

-- Enable Row Level Security on budgets table
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

-- Create policies for budgets table
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for budgets table
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);

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
    (NEW.id, 'Tax', 0.00),
    (NEW.id, 'Other', 0.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically create default budgets for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_budgets()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default monthly budgets for each category
  INSERT INTO public.budgets (user_id, category_id, budget_amount, budget_type, start_date)
  SELECT 
    NEW.id,
    c.id,
    CASE 
      WHEN c.name = 'Food and Drink' THEN 500.00
      WHEN c.name = 'Clothing' THEN 200.00
      WHEN c.name = 'Utilities' THEN 300.00
      WHEN c.name = 'Entertainment' THEN 150.00
      WHEN c.name = 'Tax' THEN 100.00
      ELSE 100.00
    END,
    'monthly',
    CURRENT_DATE
  FROM public.categories c
  WHERE c.user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create default categories when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for budgets (runs after categories are created)
DROP TRIGGER IF EXISTS on_auth_user_created_budgets ON auth.users;
CREATE TRIGGER on_auth_user_created_budgets
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_budgets();

-- Create function to calculate budget progress
CREATE OR REPLACE FUNCTION public.get_budget_progress(
  p_user_id UUID,
  p_category_id BIGINT,
  p_budget_type VARCHAR(10) DEFAULT 'monthly'
)
RETURNS TABLE (
  category_name VARCHAR(255),
  budget_amount DECIMAL(10,2),
  spent_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  progress_percentage DECIMAL(5,2),
  is_over_budget BOOLEAN,
  alert_level VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as category_name,
    COALESCE(b.budget_amount, 0) as budget_amount,
    COALESCE(c.total_spent, 0) as spent_amount,
    GREATEST(COALESCE(b.budget_amount, 0) - COALESCE(c.total_spent, 0), 0) as remaining_amount,
    CASE 
      WHEN COALESCE(b.budget_amount, 0) = 0 THEN 0
      ELSE LEAST((COALESCE(c.total_spent, 0) / COALESCE(b.budget_amount, 0)) * 100, 100)
    END as progress_percentage,
    COALESCE(c.total_spent, 0) > COALESCE(b.budget_amount, 0) as is_over_budget,
    CASE 
      WHEN COALESCE(c.total_spent, 0) >= COALESCE(b.budget_amount, 0) * 0.9 THEN 'critical'
      WHEN COALESCE(c.total_spent, 0) >= COALESCE(b.budget_amount, 0) * 0.8 THEN 'warning'
      WHEN COALESCE(c.total_spent, 0) >= COALESCE(b.budget_amount, 0) * 0.6 THEN 'info'
      ELSE 'safe'
    END as alert_level
  FROM categories c
  LEFT JOIN budgets b ON c.id = b.category_id 
    AND b.user_id = p_user_id 
    AND b.budget_type = p_budget_type 
    AND b.is_active = true
  WHERE c.id = p_category_id AND c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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