-- AfriFlix Migration 007: Payouts, Badges, Canvas, Creative DNA
-- Run in Supabase SQL editor

-- ============================================================
-- EXTEND TIPS TABLE
-- ============================================================
ALTER TABLE public.tips
  ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_id UUID;

-- ============================================================
-- BANK ACCOUNTS (creator payout destinations)
-- ============================================================
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'bank' CHECK (account_type IN ('bank', 'mobile_money')),
  -- Bank details
  bank_name TEXT,
  bank_code TEXT,             -- Flutterwave bank code
  account_number TEXT,
  account_holder_name TEXT,
  bank_account_type TEXT DEFAULT 'cheque' CHECK (bank_account_type IN ('cheque', 'savings', 'transmission', 'current')),
  branch_code TEXT,
  -- Mobile money
  mobile_provider TEXT CHECK (mobile_provider IN ('mpesa', 'mtn_momo', 'airtel_money', 'vodacom', 'orange', 'tigo', 'glo', 'zamtel')),
  mobile_number TEXT,
  -- Meta
  country TEXT NOT NULL DEFAULT 'ZA',
  currency TEXT NOT NULL DEFAULT 'ZAR',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  flutterwave_beneficiary_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id)  -- one payout destination per creator
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own bank accounts"
  ON public.bank_accounts FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ============================================================
-- PAYOUTS (disbursement records)
-- ============================================================
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,   -- after any transfer fees
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  flutterwave_transfer_id TEXT,
  flutterwave_reference TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tip_count INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators view own payouts"
  ON public.payouts FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- Add FK from tips to payouts
ALTER TABLE public.tips
  ADD CONSTRAINT tips_payout_id_fk
  FOREIGN KEY (payout_id) REFERENCES public.payouts(id);

-- ============================================================
-- MILESTONE BADGES
-- ============================================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'founding_creator',
    'first_work',
    'hearts_100', 'hearts_1000', 'hearts_10000',
    'followers_100', 'followers_1000', 'followers_10000',
    'views_1000', 'views_10000', 'views_100000',
    'works_10', 'works_50',
    'collab_completed',
    'verified_african',
    'streak_7', 'streak_30',
    'tipjar_unlocked'
  )),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, badge_type)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are public"
  ON public.badges FOR SELECT USING (true);

-- Admins / system functions only can insert badges
CREATE POLICY "System awards badges"
  ON public.badges FOR INSERT WITH CHECK (false);

-- ============================================================
-- CREATIVE DNA (Claude-generated creative identity)
-- ============================================================
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS creative_dna TEXT,
  ADD COLUMN IF NOT EXISTS creative_dna_updated_at TIMESTAMPTZ;

-- ============================================================
-- CANVAS IMPRESSIONS (for personalisation signals)
-- ============================================================
CREATE TABLE public.canvas_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  watch_pct INTEGER NOT NULL DEFAULT 0,  -- 0-100
  hearted BOOLEAN NOT NULL DEFAULT false,
  saved BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX canvas_impressions_user_idx ON public.canvas_impressions(user_id, created_at DESC);
CREATE INDEX canvas_impressions_work_idx ON public.canvas_impressions(work_id);

ALTER TABLE public.canvas_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own canvas impressions"
  ON public.canvas_impressions FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================
-- BADGE AWARD FUNCTION (SECURITY DEFINER so it can insert)
-- ============================================================
CREATE OR REPLACE FUNCTION award_badge(p_creator_id UUID, p_badge TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.badges(creator_id, badge_type)
  VALUES (p_creator_id, p_badge)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_and_award_badges(p_creator_id UUID)
RETURNS void AS $$
DECLARE c RECORD;
BEGIN
  SELECT * INTO c FROM public.creators WHERE id = p_creator_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF c.works_count >= 1  THEN PERFORM award_badge(p_creator_id, 'first_work'); END IF;
  IF c.works_count >= 10 THEN PERFORM award_badge(p_creator_id, 'works_10'); END IF;
  IF c.works_count >= 50 THEN PERFORM award_badge(p_creator_id, 'works_50'); END IF;

  IF c.total_hearts >= 100   THEN PERFORM award_badge(p_creator_id, 'hearts_100'); END IF;
  IF c.total_hearts >= 1000  THEN PERFORM award_badge(p_creator_id, 'hearts_1000'); END IF;
  IF c.total_hearts >= 10000 THEN PERFORM award_badge(p_creator_id, 'hearts_10000'); END IF;

  IF c.follower_count >= 100   THEN PERFORM award_badge(p_creator_id, 'followers_100'); END IF;
  IF c.follower_count >= 1000  THEN PERFORM award_badge(p_creator_id, 'followers_1000'); END IF;
  IF c.follower_count >= 10000 THEN PERFORM award_badge(p_creator_id, 'followers_10000'); END IF;

  IF c.total_views >= 1000   THEN PERFORM award_badge(p_creator_id, 'views_1000'); END IF;
  IF c.total_views >= 10000  THEN PERFORM award_badge(p_creator_id, 'views_10000'); END IF;
  IF c.total_views >= 100000 THEN PERFORM award_badge(p_creator_id, 'views_100000'); END IF;

  IF c.african_verified THEN PERFORM award_badge(p_creator_id, 'verified_african'); END IF;
  IF c.tips_enabled      THEN PERFORM award_badge(p_creator_id, 'tipjar_unlocked'); END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_badge_check()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_creator_stats_badge_check
  AFTER UPDATE OF total_hearts, follower_count, total_views, works_count, african_verified, tips_enabled
  ON public.creators
  FOR EACH ROW EXECUTE FUNCTION trigger_badge_check();

CREATE OR REPLACE FUNCTION trigger_work_badge_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    PERFORM check_and_award_badges(NEW.creator_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_work_published_badge_check
  AFTER INSERT OR UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION trigger_work_badge_check();
