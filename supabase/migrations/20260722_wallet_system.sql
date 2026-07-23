-- Add wallet fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS frozen_balance NUMERIC NOT NULL DEFAULT 0;

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup_bank', 'topup_card', 'topup_crypto', 'purchase', 'rent_deposit_freeze', 'rent_deposit_unfreeze', 'rent_payment', 'withdrawal', 'refund')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected', 'failed')),
    reference_id TEXT, -- Can be artwork_id, order_id, etc.
    metadata JSONB, -- For storing bank last 5 digits, receipt URL, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert pending topup requests
CREATE POLICY "Users can insert pending bank topups"
ON public.wallet_transactions FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND type = 'topup_bank' 
    AND status = 'pending'
);

-- Admin can manage all wallet transactions (assuming we use service_role or admin checking in API, but let's add a basic policy)
-- Note: Real admin logic will likely be done via server-side service role.
