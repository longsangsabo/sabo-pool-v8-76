
-- Create products table for equipment and accessories
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL, -- 'cue', 'accessories', 'table', 'chalk', 'case'
  condition TEXT DEFAULT 'new', -- 'new', 'used', 'refurbished'
  brand TEXT,
  images TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 1,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'inactive'
  tags TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  helpful_votes INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, reviewer_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_method TEXT DEFAULT 'cod', -- 'cod', 'bank_transfer', 'vnpay'
  shipping_address JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  notes TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping_cart table
CREATE TABLE public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create product_wishlist table
CREATE TABLE public.product_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create seller_profiles table
CREATE TABLE public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  business_type TEXT DEFAULT 'individual', -- 'individual', 'business'
  description TEXT,
  logo_url TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  business_license TEXT,
  tax_id TEXT,
  contact_info JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  shipping_policies TEXT,
  return_policies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Everyone can view active products" ON public.products
FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage own products" ON public.products
FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert products" ON public.products
FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS Policies for product_reviews
CREATE POLICY "Everyone can view reviews" ON public.product_reviews
FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.product_reviews
FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
FOR UPDATE USING (auth.uid() = reviewer_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own orders" ON public.orders
FOR UPDATE USING (auth.uid() = buyer_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items
FOR SELECT USING (
  auth.uid() IN (
    SELECT buyer_id FROM public.orders WHERE id = order_items.order_id
    UNION
    SELECT seller_id
  )
);

CREATE POLICY "System can manage order items" ON public.order_items
FOR ALL USING (true);

-- RLS Policies for shopping_cart
CREATE POLICY "Users can manage own cart" ON public.shopping_cart
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for product_wishlist
CREATE POLICY "Users can manage own wishlist" ON public.product_wishlist
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for seller_profiles
CREATE POLICY "Everyone can view verified sellers" ON public.seller_profiles
FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Users can manage own seller profile" ON public.seller_profiles
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_cart_user ON public.shopping_cart(user_id);
CREATE INDEX idx_wishlist_user ON public.product_wishlist(user_id);

-- Create functions for updating ratings
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update seller rating based on product reviews
  UPDATE public.seller_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(pr.rating), 0)
      FROM public.product_reviews pr
      JOIN public.products p ON pr.product_id = p.id
      WHERE p.seller_id = seller_profiles.user_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.product_reviews pr
      JOIN public.products p ON pr.product_id = p.id
      WHERE p.seller_id = seller_profiles.user_id
    )
  WHERE user_id = (
    SELECT p.seller_id
    FROM public.products p
    WHERE p.id = NEW.product_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating seller ratings
CREATE TRIGGER update_seller_rating_trigger
AFTER INSERT OR UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

-- Insert sample products
INSERT INTO public.products (seller_id, name, description, price, category, brand, specifications) VALUES
(
  (SELECT id FROM auth.users LIMIT 1),
  'Cơ Bi-a Profesional McDermott',
  'Cơ bi-a cao cấp McDermott với đầu cơ Kamui Black Medium. Thiết kế đẹp mắt, cân bằng hoàn hảo cho người chơi chuyên nghiệp.',
  15500000,
  'cue',
  'McDermott',
  '{"weight": "19oz", "tip": "Kamui Black Medium", "length": "58 inch", "material": "Maple wood"}'::jsonb
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Phấn Bi-a Master Chalk (Hộp 12 viên)',
  'Phấn bi-a Master Chalk chính hãng, độ bám cao, ít bụi. Hộp 12 viên màu xanh truyền thống.',
  250000,
  'chalk',
  'Master',
  '{"quantity": "12 pieces", "color": "Blue", "type": "Tournament grade"}'::jsonb
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Bàn Bi-a 9 Pool Star Table',
  'Bàn bi-a 9 chân Pool Star Table kích thước chuẩn 9ft. Nệm Simonis 860, bi Aramith Premium.',
  85000000,
  'table',
  'Pool Star',
  '{"size": "9ft", "cloth": "Simonis 860", "balls": "Aramith Premium", "rails": "K-66"}'::jsonb
);

-- Insert sample seller profile
INSERT INTO public.seller_profiles (
  user_id, business_name, business_type, description, verification_status, 
  contact_info, shipping_policies, return_policies
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'SABO Pool Equipment Store',
  'business',
  'Chuyên cung cấp thiết bị bi-a chính hãng, chất lượng cao. Hơn 10 năm kinh nghiệm trong ngành.',
  'verified',
  '{"phone": "0901234567", "email": "sales@sabopool.com", "address": "123 Nguyễn Văn Linh, Q7, TP.HCM"}'::jsonb,
  'Giao hàng toàn quốc trong 3-7 ngày. Miễn phí ship cho đơn hàng trên 2 triệu.',
  'Đổi trả trong 7 ngày nếu sản phẩm lỗi. Bảo hành theo chính sách nhà sản xuất.'
);
