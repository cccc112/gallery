-- ============================================================
-- Atelier Blanc — Stripe Rental Subscription Migration
-- 在 Supabase SQL Editor 執行這份腳本
-- ============================================================

-- 1. 擴充 rentals 表
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_deposit_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS next_billing_date DATE,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS artwork_returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS early_termination_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rental_months INTEGER DEFAULT 1;

-- deposit_status: 'pending' | 'paid' | 'refunded' | 'forfeited'
-- subscription_status: 'pending' | 'active' | 'past_due' | 'canceled' | 'ended'

-- 2. 新增每月付款紀錄表
CREATE TABLE IF NOT EXISTS public.rental_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,        -- 分（cents），TWD 直接等於元
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'pending',  -- 'paid' | 'failed' | 'pending'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_rentals_stripe_subscription ON public.rentals(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_rentals_stripe_customer ON public.rentals(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_rental_id ON public.rental_payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_invoice ON public.rental_payments(stripe_invoice_id);

-- 4. RLS for rental_payments
ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

-- 承租人可以看自己的付款紀錄
CREATE POLICY "tenant can view own rental payments"
  ON public.rental_payments FOR SELECT
  USING (
    rental_id IN (
      SELECT id FROM public.rentals WHERE tenant_id = auth.uid()
    )
  );

-- 藝術家可以看自己作品的付款紀錄
CREATE POLICY "artist can view artwork rental payments"
  ON public.rental_payments FOR SELECT
  USING (
    rental_id IN (
      SELECT r.id FROM public.rentals r
      JOIN public.artworks a ON r.artwork_id = a.id
      WHERE a.artist_id = auth.uid()
    )
  );

-- 只有 service_role 可以寫入（透過 Webhook）
CREATE POLICY "service_role can manage rental payments"
  ON public.rental_payments FOR ALL
  USING (auth.role() = 'service_role');
