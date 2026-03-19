-- AfriFlix — PayFast subscription tracking
-- Adds subscription token storage and a subscriptions audit table

-- Add PayFast subscription token to creators
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS payfast_subscription_token TEXT,
  ADD COLUMN IF NOT EXISTS subscription_billing_date DATE,
  ADD COLUMN IF NOT EXISTS subscription_active_until TIMESTAMPTZ;

-- Subscription event log (audit trail)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'payfast',
  payment_reference TEXT,
  token TEXT,                         -- PayFast subscription token
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'failed', 'paused')),
  billing_date DATE,
  next_billing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX subs_creator_idx ON public.subscriptions(creator_id, status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );
