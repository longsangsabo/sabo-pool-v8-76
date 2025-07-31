
-- Input validation functions
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_phone(phone TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone ~ '^0\d{9}$';
END;
$$ LANGUAGE plpgsql;

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Additional security policies for existing tables
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Enhanced indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_club_id ON public.profiles(club_id);
CREATE INDEX IF NOT EXISTS idx_memberships_type_status ON public.memberships(membership_type, status);
CREATE INDEX IF NOT EXISTS idx_tournaments_club_status ON public.tournaments(club_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    ip_addr INET,
    endpoint_name TEXT,
    max_requests INTEGER DEFAULT 5,
    window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start_time := NOW() - (window_minutes || ' minutes')::INTERVAL;
    
    -- Count requests in current window
    SELECT COALESCE(SUM(request_count), 0) 
    INTO current_count
    FROM rate_limits 
    WHERE ip_address = ip_addr 
    AND endpoint = endpoint_name 
    AND window_start > window_start_time;
    
    -- Clean old entries
    DELETE FROM rate_limits 
    WHERE window_start < window_start_time;
    
    -- Check if limit exceeded
    IF current_count >= max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update rate limit record
    INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start)
    VALUES (ip_addr, endpoint_name, 1, NOW())
    ON CONFLICT (ip_address, endpoint) 
    DO UPDATE SET 
        request_count = rate_limits.request_count + 1,
        window_start = CASE 
            WHEN NOW() - rate_limits.window_start > (window_minutes || ' minutes')::INTERVAL 
            THEN NOW() 
            ELSE rate_limits.window_start 
        END;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    membership_id UUID REFERENCES public.memberships(id),
    transaction_ref TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    payment_method VARCHAR(20) DEFAULT 'vnpay',
    status VARCHAR(20) DEFAULT 'pending',
    vnpay_response_code VARCHAR(10),
    vnpay_transaction_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
    ON payment_transactions 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" 
    ON payment_transactions 
    FOR ALL 
    USING (true);

-- Create indexes for payment_transactions
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_ref ON payment_transactions(transaction_ref);

-- Function to create payment transaction
CREATE OR REPLACE FUNCTION create_payment_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_ref TEXT
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO payment_transactions (user_id, amount, transaction_ref)
    VALUES (p_user_id, p_amount, p_transaction_ref)
    RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update membership after successful payment
CREATE OR REPLACE FUNCTION upgrade_membership_after_payment(
    p_user_id UUID,
    p_transaction_ref TEXT,
    p_membership_type VARCHAR(20) DEFAULT 'premium'
)
RETURNS BOOLEAN AS $$
DECLARE
    transaction_exists BOOLEAN;
BEGIN
    -- Check if transaction exists and is successful
    SELECT EXISTS(
        SELECT 1 FROM payment_transactions 
        WHERE user_id = p_user_id 
        AND transaction_ref = p_transaction_ref 
        AND status = 'success'
    ) INTO transaction_exists;
    
    IF NOT transaction_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update existing membership or create new one
    INSERT INTO public.memberships (
        user_id, 
        membership_type, 
        price, 
        start_date, 
        end_date, 
        status
    ) VALUES (
        p_user_id,
        p_membership_type,
        99000,
        NOW(),
        NOW() + INTERVAL '1 month',
        'active'
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        membership_type = p_membership_type,
        price = 99000,
        start_date = NOW(),
        end_date = NOW() + INTERVAL '1 month',
        status = 'active',
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
