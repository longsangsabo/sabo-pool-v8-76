-- Migration: Create betting system tables for challenge wagering
-- Created: 2025-08-03
-- Purpose: Support challenge betting functionality in FinancialHub

-- Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_id UUID,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_bets table for betting system
CREATE TABLE IF NOT EXISTS challenge_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    bettor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bet_amount DECIMAL(15,2) NOT NULL,
    bet_on_user_id UUID REFERENCES auth.users(id) NOT NULL,
    odds DECIMAL(5,2) DEFAULT 2.00,
    potential_payout DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
    payout DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_bet_amount CHECK (bet_amount > 0),
    CONSTRAINT positive_odds CHECK (odds > 0),
    CONSTRAINT valid_payout CHECK (payout >= 0),
    CONSTRAINT no_self_betting CHECK (bettor_id != bet_on_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_bets_challenge_id ON challenge_bets(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_bets_bettor_id ON challenge_bets(bettor_id);
CREATE INDEX IF NOT EXISTS idx_challenge_bets_status ON challenge_bets(status);
CREATE INDEX IF NOT EXISTS idx_challenge_bets_created_at ON challenge_bets(created_at DESC);

-- Add RLS policies for security
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_bets ENABLE ROW LEVEL SECURITY;

-- User wallet policies
CREATE POLICY "Users can view their own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert user wallets" ON user_wallets
    FOR INSERT WITH CHECK (true);

-- Transaction policies
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

-- Challenge bet policies
CREATE POLICY "Users can view their own bets" ON challenge_bets
    FOR SELECT USING (auth.uid() = bettor_id);

CREATE POLICY "Anyone can view public bet statistics" ON challenge_bets
    FOR SELECT USING (true);

CREATE POLICY "Users can place bets" ON challenge_bets
    FOR INSERT WITH CHECK (auth.uid() = bettor_id);

CREATE POLICY "System can update bet results" ON challenge_bets
    FOR UPDATE WITH CHECK (true);

-- Create trigger to calculate potential payout automatically
CREATE OR REPLACE FUNCTION calculate_potential_payout()
RETURNS TRIGGER AS $$
BEGIN
    NEW.potential_payout = NEW.bet_amount * NEW.odds;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_potential_payout
    BEFORE INSERT OR UPDATE ON challenge_bets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_potential_payout();

-- Create function to process bet settlement
CREATE OR REPLACE FUNCTION settle_challenge_bets(challenge_id_param UUID, winner_id_param UUID)
RETURNS VOID AS $$
DECLARE
    bet_record RECORD;
BEGIN
    -- Process all bets for this challenge
    FOR bet_record IN 
        SELECT * FROM challenge_bets 
        WHERE challenge_id = challenge_id_param AND status = 'active'
    LOOP
        IF bet_record.bet_on_user_id = winner_id_param THEN
            -- Winning bet
            UPDATE challenge_bets 
            SET 
                status = 'won',
                payout = bet_record.potential_payout,
                updated_at = NOW()
            WHERE id = bet_record.id;
            
            -- Add winnings to user wallet
            INSERT INTO user_wallets (user_id, balance)
            VALUES (bet_record.bettor_id, bet_record.potential_payout)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                balance = user_wallets.balance + bet_record.potential_payout,
                updated_at = NOW();
            
            -- Record transaction
            INSERT INTO transactions (
                user_id, 
                amount, 
                transaction_type, 
                description, 
                reference_id
            ) VALUES (
                bet_record.bettor_id,
                bet_record.potential_payout,
                'bet_win',
                'Winning bet payout for challenge ' || challenge_id_param::text,
                bet_record.id
            );
        ELSE
            -- Losing bet
            UPDATE challenge_bets 
            SET 
                status = 'lost',
                payout = 0,
                updated_at = NOW()
            WHERE id = bet_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize user wallet
CREATE OR REPLACE FUNCTION initialize_user_wallet(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_wallets (user_id, balance)
    VALUES (user_id_param, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Add some initial data for testing
INSERT INTO user_wallets (user_id, balance) 
SELECT id, 1000000.00 
FROM auth.users 
WHERE id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE user_wallets IS 'User wallet balances for financial transactions';
COMMENT ON TABLE transactions IS 'Transaction history for all financial activities';
COMMENT ON TABLE challenge_bets IS 'Betting records for challenge wagering system';
COMMENT ON FUNCTION settle_challenge_bets IS 'Process bet settlements when a challenge is completed';
COMMENT ON FUNCTION initialize_user_wallet IS 'Initialize wallet for new users';
