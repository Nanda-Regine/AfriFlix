-- AfriFlix Phase 2 — Initial Schema
-- Run this via: supabase db push OR supabase migration up

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Uncomment when pgvector is available on your Supabase project:
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- CREATORS
-- ============================================================
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,

  -- Location
  country TEXT NOT NULL DEFAULT 'South Africa',
  city TEXT,
  is_diaspora BOOLEAN NOT NULL DEFAULT false,
  african_verified BOOLEAN NOT NULL DEFAULT false,

  -- Creative identity
  categories TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  cultural_roots TEXT[] NOT NULL DEFAULT '{}',

  -- Media
  avatar_url TEXT,
  banner_url TEXT,
  promo_reel_url TEXT,

  -- Stats (denormalised)
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_hearts INTEGER NOT NULL DEFAULT 0,
  works_count INTEGER NOT NULL DEFAULT 0,

  -- Monetisation
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'creator_pro', 'label', 'brand')),
  tips_enabled BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id TEXT,
  flutterwave_account_id TEXT,
  payfast_merchant_id TEXT,

  -- Discovery
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_rising BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX creators_user_id_idx ON public.creators(user_id);

-- ============================================================
-- SERIES
-- ============================================================
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_url TEXT,
  trailer_url TEXT,
  season_count INTEGER NOT NULL DEFAULT 1,
  episode_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ALBUMS
-- ============================================================
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_date DATE,
  album_type TEXT NOT NULL DEFAULT 'album' CHECK (album_type IN ('album', 'ep', 'single', 'mixtape', 'live_session')),
  track_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKS
-- ============================================================
CREATE TABLE public.works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('film', 'music', 'dance', 'writing', 'poetry', 'comedy', 'theatre', 'visual_art')),

  -- Format-specific
  video_url TEXT,
  video_thumbnail TEXT,
  video_duration_seconds INTEGER,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  written_content TEXT,
  cover_art_url TEXT,
  gallery_urls TEXT[],

  -- Grouping
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  episode_number INTEGER,
  track_number INTEGER,

  -- Metadata
  description TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  cultural_origin TEXT,
  country_of_origin TEXT,
  year_created INTEGER,
  collaborators JSONB,

  -- Content flags
  is_explicit BOOLEAN NOT NULL DEFAULT false,
  trigger_warnings TEXT[] NOT NULL DEFAULT '{}',
  age_rating TEXT NOT NULL DEFAULT 'G' CHECK (age_rating IN ('G', 'PG', '13', '16', '18')),

  -- AI enrichment (Claude-generated)
  ai_summary TEXT,
  mood_tags TEXT[] NOT NULL DEFAULT '{}',
  theme_tags TEXT[] NOT NULL DEFAULT '{}',
  -- embedding VECTOR(1536),  -- Uncomment when pgvector extension is enabled

  -- Discovery
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,

  -- Engagement (denormalised)
  view_count INTEGER NOT NULL DEFAULT 0,
  heart_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'scheduled', 'removed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for hot paths
CREATE INDEX works_category_idx ON public.works(category);
CREATE INDEX works_status_idx ON public.works(status);
CREATE INDEX works_creator_idx ON public.works(creator_id);
CREATE INDEX works_trending_idx ON public.works(is_trending, view_count DESC);
CREATE INDEX works_featured_idx ON public.works(is_featured, heart_count DESC);
CREATE INDEX works_mood_idx ON public.works USING GIN(mood_tags);
CREATE INDEX works_genres_idx ON public.works USING GIN(genres);

-- ============================================================
-- TASTE PROFILES
-- ============================================================
CREATE TABLE public.taste_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories TEXT[] NOT NULL DEFAULT '{}',
  preferred_genres TEXT[] NOT NULL DEFAULT '{}',
  preferred_languages TEXT[] NOT NULL DEFAULT '{}',
  preferred_countries TEXT[] NOT NULL DEFAULT '{}',
  cultural_affinities TEXT[] NOT NULL DEFAULT '{}',
  mood_preferences TEXT[] NOT NULL DEFAULT '{}',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HISTORY
-- ============================================================
CREATE TABLE public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  progress_pct DECIMAL(5,4),
  completed BOOLEAN NOT NULL DEFAULT false,
  last_watched TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, work_id)
);

CREATE INDEX history_user_idx ON public.history(user_id, last_watched DESC);

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  category_filter TEXT,
  work_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.collection_works (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, work_id)
);

-- ============================================================
-- ENGAGEMENT
-- ============================================================
CREATE TABLE public.hearts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_ref INTEGER,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  heart_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX comments_work_idx ON public.comments(work_id, created_at DESC);

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_creator_id)
);

-- ============================================================
-- COLLAB BOARD
-- ============================================================
CREATE TABLE public.collabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('collab', 'commission', 'gig', 'casting', 'mentorship')),
  category TEXT,
  description TEXT NOT NULL,
  skills_needed TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  compensation_type TEXT CHECK (compensation_type IN ('paid', 'revenue_share', 'credit_only')),
  budget_range TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  application_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX collabs_status_idx ON public.collabs(status, created_at DESC);

CREATE TABLE public.collab_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id UUID NOT NULL REFERENCES public.collabs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  pitch TEXT,
  portfolio_links TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collab_id, applicant_id)
);

-- ============================================================
-- TIPS
-- ============================================================
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_creator_id UUID NOT NULL REFERENCES public.creators(id),
  work_id UUID REFERENCES public.works(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  message TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('payfast', 'flutterwave', 'stripe')),
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS (content moderation)
-- ============================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  work_id UUID NOT NULL REFERENCES public.works(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Works RLS
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published works are public"
  ON public.works FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators manage own works"
  ON public.works FOR ALL
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Creators RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators are public"
  ON public.creators FOR SELECT
  USING (true);

CREATE POLICY "Creators manage own profile"
  ON public.creators FOR UPDATE
  USING (user_id = auth.uid());

-- History RLS
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own history"
  ON public.history FOR ALL
  USING (user_id = auth.uid());

-- Taste profiles RLS
ALTER TABLE public.taste_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own taste profile"
  ON public.taste_profiles FOR ALL
  USING (user_id = auth.uid());

-- Hearts RLS
ALTER TABLE public.hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hearts are public"
  ON public.hearts FOR SELECT
  USING (true);

CREATE POLICY "Users manage own hearts"
  ON public.hearts FOR INSERT
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own hearts"
  ON public.hearts FOR DELETE
  USING (user_id = auth.uid());

-- Comments RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are public"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own comments"
  ON public.comments FOR DELETE
  USING (user_id = auth.uid());

-- Collections RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public collections are visible"
  ON public.collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users manage own collections"
  ON public.collections FOR ALL
  USING (user_id = auth.uid());

-- Collabs RLS
ALTER TABLE public.collabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open collabs are public"
  ON public.collabs FOR SELECT
  USING (status = 'open');

CREATE POLICY "Creators manage own collabs"
  ON public.collabs FOR ALL
  USING (
    creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-increment works_count on creator when work published
CREATE OR REPLACE FUNCTION increment_creator_works_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    UPDATE public.creators SET works_count = works_count + 1 WHERE id = NEW.creator_id;
  ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
    UPDATE public.creators SET works_count = GREATEST(0, works_count - 1) WHERE id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_work_status_change
  AFTER INSERT OR UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION increment_creator_works_count();

-- Auto-increment heart_count
CREATE OR REPLACE FUNCTION update_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.works SET heart_count = heart_count + 1 WHERE id = NEW.work_id;
    UPDATE public.creators SET total_hearts = total_hearts + 1
      WHERE id = (SELECT creator_id FROM public.works WHERE id = NEW.work_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.works SET heart_count = GREATEST(0, heart_count - 1) WHERE id = OLD.work_id;
    UPDATE public.creators SET total_hearts = GREATEST(0, total_hearts - 1)
      WHERE id = (SELECT creator_id FROM public.works WHERE id = OLD.work_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_heart_change
  AFTER INSERT OR DELETE ON public.hearts
  FOR EACH ROW EXECUTE FUNCTION update_heart_count();

-- Auto-increment follow count
CREATE OR REPLACE FUNCTION update_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creators SET follower_count = follower_count + 1 WHERE id = NEW.following_creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creators SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_creator_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_count();

-- Auto-increment collab application count
CREATE OR REPLACE FUNCTION update_collab_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collabs SET application_count = application_count + 1 WHERE id = NEW.collab_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_collab_application
  AFTER INSERT ON public.collab_applications
  FOR EACH ROW EXECUTE FUNCTION update_collab_application_count();

-- Auto-expire collab listings past deadline
-- Run via: supabase/functions/expire-collabs (cron: daily)
CREATE OR REPLACE FUNCTION expire_past_collabs()
RETURNS void AS $$
BEGIN
  UPDATE public.collabs
  SET status = 'closed'
  WHERE status = 'open'
    AND deadline IS NOT NULL
    AND deadline < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA (Phase 1 works — 17 items)
-- ============================================================
-- Note: Run this AFTER auth.users are created in your environment.
-- These are placeholder inserts — creator_id must be replaced with real UUIDs.

-- INSERT INTO public.works (title, category, status, is_trending, is_featured, view_count, heart_count)
-- VALUES
--   ('The Weight of Ubuntu', 'film', 'published', true, false, 12400, 890),
--   ('Daughters of Soweto', 'film', 'published', false, false, 9800, 720),
--   ... (add more as needed after seeding creators)
