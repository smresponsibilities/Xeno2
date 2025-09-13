-- Shopify Insights Database Setup for Supabase
-- Run this SQL in your Supabase SQL editor

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  shopify_store_url TEXT,
  shopify_access_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create shopify_customers table
CREATE TABLE IF NOT EXISTS shopify_customers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shopify_customer_id BIGINT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  total_spent DECIMAL(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, shopify_customer_id)
);

-- Create shopify_orders table
CREATE TABLE IF NOT EXISTS shopify_orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shopify_order_id BIGINT NOT NULL,
  shopify_customer_id BIGINT,
  email TEXT,
  order_number INTEGER,
  total_price DECIMAL(10,2),
  subtotal_price DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  financial_status TEXT,
  fulfillment_status TEXT,
  order_status_url TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, shopify_order_id)
);

-- Create shopify_products table
CREATE TABLE IF NOT EXISTS shopify_products (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shopify_product_id BIGINT NOT NULL,
  title TEXT,
  vendor TEXT,
  product_type TEXT,
  handle TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, shopify_product_id)
);

-- Create data_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS data_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL, -- 'customers', 'orders', 'products'
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopify_customers_user_id ON shopify_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_customers_email ON shopify_customers(email);
CREATE INDEX IF NOT EXISTS idx_shopify_customers_total_spent ON shopify_customers(total_spent DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_user_id ON shopify_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_customer_id ON shopify_orders(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created_at ON shopify_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_total_price ON shopify_orders(total_price);

CREATE INDEX IF NOT EXISTS idx_shopify_products_user_id ON shopify_products(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_user_id ON data_sync_logs(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shopify customers policies
CREATE POLICY "Users can view own customers" ON shopify_customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON shopify_customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON shopify_customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON shopify_customers FOR DELETE USING (auth.uid() = user_id);

-- Shopify orders policies
CREATE POLICY "Users can view own orders" ON shopify_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON shopify_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON shopify_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON shopify_orders FOR DELETE USING (auth.uid() = user_id);

-- Shopify products policies
CREATE POLICY "Users can view own products" ON shopify_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON shopify_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON shopify_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON shopify_products FOR DELETE USING (auth.uid() = user_id);

-- Data sync logs policies
CREATE POLICY "Users can view own sync logs" ON data_sync_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs" ON data_sync_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync logs" ON data_sync_logs FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create materialized view for analytics (optional optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_analytics AS
SELECT 
  c.user_id,
  c.shopify_customer_id,
  c.email,
  c.first_name,
  c.last_name,
  c.total_spent,
  c.orders_count,
  COUNT(o.id) as actual_orders_count,
  SUM(o.total_price) as actual_total_spent,
  MIN(o.created_at) as first_order_date,
  MAX(o.created_at) as last_order_date
FROM shopify_customers c
LEFT JOIN shopify_orders o ON c.shopify_customer_id = o.shopify_customer_id AND c.user_id = o.user_id
GROUP BY c.user_id, c.shopify_customer_id, c.email, c.first_name, c.last_name, c.total_spent, c.orders_count;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_customer_analytics_user_id ON customer_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_total_spent ON customer_analytics(actual_total_spent DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh the materialized view function (for future use)
CREATE OR REPLACE FUNCTION refresh_customer_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW customer_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
