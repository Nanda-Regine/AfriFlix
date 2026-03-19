-- ============================================================================
-- AFRIFLIX MASTER DATABASE SCHEMA
-- Single-file, idempotent. Run once in Supabase SQL Editor on a fresh project.
-- Consolidates migrations 001–009.
-- Last updated: 2026-03-19
-- ============================================================================

BEGIN;

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Uncomment after enabling pgvector in Supabase dashboard → Database → Extensions:
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ── CREATORS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.creators (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name                TEXT        NOT NULL,
  username                    TEXT        UNIQUE NOT NULL,
  bio                         TEXT,

  -- Location
  country                     TEXT        NOT NULL DEFAULT 'South Africa',
  city                        TEXT,
  is_diaspora                 BOOLEAN     NOT NULL DEFAULT false,
  african_verified            BOOLEAN     NOT NULL DEFAULT false,

  -- Creative identity
  categories                  TEXT[]      NOT NULL DEFAULT '{}',
  languages                   TEXT[]      NOT NULL DEFAULT '{}',
  cultural_roots              TEXT[]      NOT NULL DEFAULT '{}',

  -- Media
  avatar_url                  TEXT,
  banner_url                  TEXT,
  promo_reel_url              TEXT,

  -- Stats (denormalised for fast reads)
  follower_count              INTEGER     NOT NULL DEFAULT 0,
  following_count             INTEGER     NOT NULL DEFAULT 0,
  total_views                 INTEGER     NOT NULL DEFAULT 0,
  total_hearts                INTEGER     NOT NULL DEFAULT 0,
  works_count                 INTEGER     NOT NULL DEFAULT 0,

  -- Monetisation
  plan                        TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'creator_pro', 'label', 'brand')),
  tips_enabled                BOOLEAN     NOT NULL DEFAULT false,
  stripe_account_id           TEXT,
  flutterwave_account_id      TEXT,
  payfast_merchant_id         TEXT,

  -- Subscription (migration 006)
  payfast_subscription_token  TEXT,
  subscription_billing_date   DATE,
  subscription_active_until   TIMESTAMPTZ,

  -- Creative DNA (migration 007)
  creative_dna                TEXT,
  creative_dna_updated_at     TIMESTAMPTZ,

  -- Discovery
  is_featured                 BOOLEAN     NOT NULL DEFAULT false,
  is_rising                   BOOLEAN     NOT NULL DEFAULT false,

  -- Full-text search (migration 005)
  search_vector               TSVECTOR    GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(username,     '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio,          '')), 'B')
  ) STORED,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS creators_user_id_idx ON public.creators(user_id);
CREATE INDEX        IF NOT EXISTS creators_fts_idx     ON public.creators USING GIN(search_vector);
CREATE INDEX        IF NOT EXISTS creators_country_idx ON public.creators(country);

-- ── SERIES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.series (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  category      TEXT,
  cover_url     TEXT,
  trailer_url   TEXT,
  season_count  INTEGER     NOT NULL DEFAULT 1,
  episode_count INTEGER     NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'ongoing'
    CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ALBUMS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.albums (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  release_date DATE,
  album_type   TEXT        NOT NULL DEFAULT 'album'
    CHECK (album_type IN ('album', 'ep', 'single', 'mixtape', 'live_session')),
  track_count  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── WORKS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.works (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id              UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title                   TEXT        NOT NULL,
  category                TEXT        NOT NULL
    CHECK (category IN ('film','music','dance','writing','poetry','comedy','theatre','visual_art')),

  -- Format-specific media
  video_url               TEXT,
  video_thumbnail         TEXT,
  video_duration_seconds  INTEGER,
  audio_url               TEXT,
  audio_duration_seconds  INTEGER,
  written_content         TEXT,
  cover_art_url           TEXT,
  gallery_urls            TEXT[],

  -- Grouping
  series_id               UUID        REFERENCES public.series(id)  ON DELETE SET NULL,
  album_id                UUID        REFERENCES public.albums(id)   ON DELETE SET NULL,
  episode_number          INTEGER,
  track_number            INTEGER,

  -- Metadata
  description             TEXT,
  genres                  TEXT[]      NOT NULL DEFAULT '{}',
  languages               TEXT[]      NOT NULL DEFAULT '{}',
  cultural_origin         TEXT,
  country_of_origin       TEXT,
  year_created            INTEGER,
  collaborators           JSONB,

  -- Content flags
  is_explicit             BOOLEAN     NOT NULL DEFAULT false,
  trigger_warnings        TEXT[]      NOT NULL DEFAULT '{}',
  age_rating              TEXT        NOT NULL DEFAULT 'G'
    CHECK (age_rating IN ('G','PG','13','16','18')),

  -- AI enrichment (Claude-generated)
  ai_summary              TEXT,
  mood_tags               TEXT[]      NOT NULL DEFAULT '{}',
  theme_tags              TEXT[]      NOT NULL DEFAULT '{}',
  -- embedding VECTOR(1536), -- Uncomment after enabling pgvector

  -- Discovery
  is_featured             BOOLEAN     NOT NULL DEFAULT false,
  is_trending             BOOLEAN     NOT NULL DEFAULT false,
  trending_score          FLOAT                DEFAULT 0,

  -- Engagement (denormalised)
  view_count              INTEGER     NOT NULL DEFAULT 0,
  heart_count             INTEGER     NOT NULL DEFAULT 0,
  comment_count           INTEGER     NOT NULL DEFAULT 0,
  share_count             INTEGER     NOT NULL DEFAULT 0,
  save_count              INTEGER     NOT NULL DEFAULT 0,

  -- Status
  status                  TEXT        NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft','published','scheduled','removed')),
  scheduled_at            TIMESTAMPTZ,
  published_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Full-text search (migration 005)
  search_vector           TSVECTOR    GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,          '')), 'A') ||
    setweight(to_tsvector('english', coalesce(ai_summary,     '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description,    '')), 'C') ||
    setweight(to_tsvector('english', coalesce(cultural_origin,'')), 'D')
  ) STORED,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS works_category_idx       ON public.works(category);
CREATE INDEX IF NOT EXISTS works_status_idx         ON public.works(status);
CREATE INDEX IF NOT EXISTS works_creator_idx        ON public.works(creator_id);
CREATE INDEX IF NOT EXISTS works_trending_idx       ON public.works(is_trending, view_count DESC);
CREATE INDEX IF NOT EXISTS works_trending_score_idx ON public.works(trending_score DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS works_featured_idx       ON public.works(is_featured, heart_count DESC);
CREATE INDEX IF NOT EXISTS works_fts_idx            ON public.works USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS works_mood_idx           ON public.works USING GIN(mood_tags);
CREATE INDEX IF NOT EXISTS works_genres_idx         ON public.works USING GIN(genres);

-- ── TASTE PROFILES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.taste_profiles (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories  TEXT[]      NOT NULL DEFAULT '{}',
  preferred_genres      TEXT[]      NOT NULL DEFAULT '{}',
  preferred_languages   TEXT[]      NOT NULL DEFAULT '{}',
  preferred_countries   TEXT[]      NOT NULL DEFAULT '{}',
  cultural_affinities   TEXT[]      NOT NULL DEFAULT '{}',
  mood_preferences      TEXT[]      NOT NULL DEFAULT '{}',
  onboarding_complete   BOOLEAN     NOT NULL DEFAULT false,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── HISTORY ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id          UUID        NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  progress_seconds INTEGER     NOT NULL DEFAULT 0,
  progress_pct     DECIMAL(5,4),
  completed        BOOLEAN     NOT NULL DEFAULT false,
  last_watched     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, work_id)
);

CREATE INDEX IF NOT EXISTS history_user_idx ON public.history(user_id, last_watched DESC);

-- ── COLLECTIONS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  cover_url       TEXT,
  is_public       BOOLEAN     NOT NULL DEFAULT true,
  category_filter TEXT,
  work_count      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_works (
  collection_id UUID        NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  work_id       UUID        NOT NULL REFERENCES public.works(id)       ON DELETE CASCADE,
  position      INTEGER,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, work_id)
);

-- ── ENGAGEMENT ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hearts (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id    UUID        NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id       UUID        NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  content       TEXT        NOT NULL,
  timestamp_ref INTEGER,
  parent_id     UUID        REFERENCES public.comments(id) ON DELETE CASCADE,
  heart_count   INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_work_idx ON public.comments(work_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id          UUID        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  following_creator_id UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_creator_id)
);

-- ── COMMENT HEARTS (migration 002) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comment_hearts (
  user_id    UUID        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  comment_id UUID        NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- ── CREATOR NOTES (migration 002) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.creator_notes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  content       TEXT        NOT NULL,
  image_url     TEXT,
  link_url      TEXT,
  link_title    TEXT,
  heart_count   INTEGER     NOT NULL DEFAULT 0,
  comment_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS creator_notes_creator_idx ON public.creator_notes(creator_id, created_at DESC);

-- ── ACTIVITY FEED (migration 002) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  actor_creator_id    UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  actor_display_name  TEXT        NOT NULL,
  actor_avatar_url    TEXT,
  verb                TEXT        NOT NULL
    CHECK (verb IN ('published_work','published_note','started_collab','milestone')),
  object_type         TEXT        CHECK (object_type IN ('work','note','collab')),
  object_id           UUID,
  object_title        TEXT,
  object_thumbnail    TEXT,
  object_category     TEXT,
  is_read             BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_feed_user_idx   ON public.activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_feed_unread_idx ON public.activity_feed(user_id, is_read) WHERE is_read = false;

-- ── NOTIFICATIONS (migrations 002 + 008) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL
    CHECK (type IN (
      'tip_received','new_follower','collab_application','collab_accepted',
      'comment_on_work','comment_reply','heart_milestone',
      'new_work','badge_awarded','payout_processed'
    )),
  title           TEXT        NOT NULL,
  body            TEXT,
  link            TEXT,
  link_url        TEXT,
  actor_avatar_url TEXT,
  metadata        JSONB,
  is_read         BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx   ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ── COLLAB BOARD ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collabs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id         UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title              TEXT        NOT NULL,
  type               TEXT        NOT NULL
    CHECK (type IN ('collab','commission','gig','casting','mentorship')),
  category           TEXT,
  description        TEXT        NOT NULL,
  skills_needed      TEXT[]      NOT NULL DEFAULT '{}',
  location           TEXT,
  compensation_type  TEXT        CHECK (compensation_type IN ('paid','revenue_share','credit_only')),
  budget_range       TEXT,
  deadline           DATE,
  status             TEXT        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','closed','filled')),
  application_count  INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collabs_status_idx ON public.collabs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.collab_applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_id    UUID        NOT NULL REFERENCES public.collabs(id)   ON DELETE CASCADE,
  applicant_id UUID        NOT NULL REFERENCES public.creators(id)  ON DELETE CASCADE,
  pitch        TEXT,
  portfolio_links TEXT[]   NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','shortlisted','accepted','declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collab_id, applicant_id)
);

-- ── TIPS (migrations 001 + 007) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tips (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id      UUID        NOT NULL REFERENCES auth.users(id),
  to_creator_id     UUID        NOT NULL REFERENCES public.creators(id),
  work_id           UUID        REFERENCES public.works(id),
  amount            DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  net_amount        DECIMAL(10,2),
  platform_fee      DECIMAL(10,2),
  currency          TEXT        NOT NULL DEFAULT 'ZAR',
  message           TEXT,
  payment_provider  TEXT        CHECK (payment_provider IN ('payfast','flutterwave','stripe')),
  payment_reference TEXT,
  is_paid           BOOLEAN     NOT NULL DEFAULT false,
  payout_id         UUID,          -- FK added after payouts table
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','refunded')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── REPORTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID        NOT NULL REFERENCES auth.users(id),
  work_id     UUID        NOT NULL REFERENCES public.works(id),
  reason      TEXT        NOT NULL,
  details     TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── VERIFICATION REQUESTS (migration 005) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  method              TEXT        NOT NULL
    CHECK (method IN ('id_document','social_link','community_voucher')),
  id_document_url     TEXT,
  social_proof_url    TEXT,
  voucher_creator_id  UUID        REFERENCES public.creators(id),
  notes               TEXT,
  admin_notes         TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','approved','rejected')),
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS verify_creator_idx ON public.verification_requests(creator_id, status);

-- ── LIVE STREAMS (migration 005) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_streams (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id           UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title                TEXT        NOT NULL,
  description          TEXT,
  category             TEXT,
  cloudflare_live_uid  TEXT        NOT NULL,
  rtmps_url            TEXT,
  rtmps_key            TEXT,
  webrtc_url           TEXT,
  status               TEXT        NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle','live','ended')),
  viewer_count         INTEGER     NOT NULL DEFAULT 0,
  started_at           TIMESTAMPTZ,
  ended_at             TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS live_streams_creator_idx ON public.live_streams(creator_id, status);
CREATE INDEX IF NOT EXISTS live_streams_live_idx    ON public.live_streams(status, viewer_count DESC);

-- ── SUBSCRIPTIONS (migration 006) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  plan              TEXT        NOT NULL,
  provider          TEXT        NOT NULL DEFAULT 'payfast',
  payment_reference TEXT,
  token             TEXT,
  amount            DECIMAL(10,2) NOT NULL,
  currency          TEXT        NOT NULL DEFAULT 'ZAR',
  status            TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','failed','paused')),
  billing_date      DATE,
  next_billing_date DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subs_creator_idx ON public.subscriptions(creator_id, status);

-- ── BANK ACCOUNTS (migration 007) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id                  UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  account_type                TEXT        NOT NULL DEFAULT 'bank'
    CHECK (account_type IN ('bank','mobile_money')),
  bank_name                   TEXT,
  bank_code                   TEXT,
  account_number              TEXT,
  account_holder_name         TEXT,
  bank_account_type           TEXT        DEFAULT 'cheque'
    CHECK (bank_account_type IN ('cheque','savings','transmission','current')),
  branch_code                 TEXT,
  mobile_provider             TEXT
    CHECK (mobile_provider IN ('mpesa','mtn_momo','airtel_money','vodacom','orange','tigo','glo','zamtel')),
  mobile_number               TEXT,
  country                     TEXT        NOT NULL DEFAULT 'ZA',
  currency                    TEXT        NOT NULL DEFAULT 'ZAR',
  is_verified                 BOOLEAN     NOT NULL DEFAULT false,
  is_active                   BOOLEAN     NOT NULL DEFAULT true,
  flutterwave_beneficiary_id  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id)
);

-- ── PAYOUTS (migration 007) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payouts (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id             UUID          NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  bank_account_id        UUID          REFERENCES public.bank_accounts(id),
  gross_amount           DECIMAL(10,2) NOT NULL,
  net_amount             DECIMAL(10,2) NOT NULL,
  currency               TEXT          NOT NULL DEFAULT 'ZAR',
  status                 TEXT          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  flutterwave_transfer_id  TEXT,
  flutterwave_reference    TEXT,
  period_start           DATE          NOT NULL,
  period_end             DATE          NOT NULL,
  tip_count              INTEGER       NOT NULL DEFAULT 0,
  failure_reason         TEXT,
  initiated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- FK from tips to payouts (add after both tables exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tips_payout_id_fk'
  ) THEN
    ALTER TABLE public.tips
      ADD CONSTRAINT tips_payout_id_fk
      FOREIGN KEY (payout_id) REFERENCES public.payouts(id);
  END IF;
END $$;

-- ── BADGES (migration 007) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  badge_type  TEXT        NOT NULL CHECK (badge_type IN (
    'founding_creator',
    'first_work',
    'hearts_100','hearts_1000','hearts_10000',
    'followers_100','followers_1000','followers_10000',
    'views_1000','views_10000','views_100000',
    'works_10','works_50',
    'collab_completed',
    'verified_african',
    'streak_7','streak_30',
    'tipjar_unlocked'
  )),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, badge_type)
);

-- ── CANVAS IMPRESSIONS (migration 007) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.canvas_impressions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id     UUID        NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  watch_pct   INTEGER     NOT NULL DEFAULT 0,
  hearted     BOOLEAN     NOT NULL DEFAULT false,
  saved       BOOLEAN     NOT NULL DEFAULT false,
  skipped     BOOLEAN     NOT NULL DEFAULT false,
  session_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS canvas_impressions_user_idx ON public.canvas_impressions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS canvas_impressions_work_idx ON public.canvas_impressions(work_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Helper: enable RLS on all tables
ALTER TABLE public.creators            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_works    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_hearts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collabs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_impressions  ENABLE ROW LEVEL SECURITY;

-- Drop all policies before recreating (idempotent)
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT schemaname, tablename, policyname
           FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── creators ─────────────────────────────────────────────────────────────────
CREATE POLICY "Creators are public"
  ON public.creators FOR SELECT USING (true);

CREATE POLICY "Creators manage own profile"
  ON public.creators FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own creator profile"
  ON public.creators FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ── works ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Published works are public"
  ON public.works FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators manage own works"
  ON public.works FOR ALL
  USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

-- ── series / albums ───────────────────────────────────────────────────────────
CREATE POLICY "Series are public"
  ON public.series FOR SELECT USING (true);

CREATE POLICY "Creators manage own series"
  ON public.series FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "Albums are public"
  ON public.albums FOR SELECT USING (true);

CREATE POLICY "Creators manage own albums"
  ON public.albums FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── taste_profiles ────────────────────────────────────────────────────────────
CREATE POLICY "Users manage own taste profile"
  ON public.taste_profiles FOR ALL USING (user_id = auth.uid());

-- ── history ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users manage own history"
  ON public.history FOR ALL USING (user_id = auth.uid());

-- ── collections ───────────────────────────────────────────────────────────────
CREATE POLICY "Public collections are visible"
  ON public.collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users manage own collections"
  ON public.collections FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage own collection works"
  ON public.collection_works FOR ALL
  USING (
    collection_id IN (SELECT id FROM public.collections WHERE user_id = auth.uid())
  );

-- ── hearts ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Hearts are public"
  ON public.hearts FOR SELECT USING (true);

CREATE POLICY "Users add own hearts"
  ON public.hearts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own hearts"
  ON public.hearts FOR DELETE USING (user_id = auth.uid());

-- ── comments ──────────────────────────────────────────────────────────────────
CREATE POLICY "Comments are public"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own comments"
  ON public.comments FOR DELETE USING (user_id = auth.uid());

-- ── follows ───────────────────────────────────────────────────────────────────
CREATE POLICY "Follows are public"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users manage own follows"
  ON public.follows FOR ALL USING (follower_id = auth.uid());

-- ── comment_hearts ────────────────────────────────────────────────────────────
CREATE POLICY "Comment hearts are public"
  ON public.comment_hearts FOR SELECT USING (true);

CREATE POLICY "Users add own comment hearts"
  ON public.comment_hearts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own comment hearts"
  ON public.comment_hearts FOR DELETE USING (user_id = auth.uid());

-- ── creator_notes ─────────────────────────────────────────────────────────────
CREATE POLICY "Creator notes are public"
  ON public.creator_notes FOR SELECT USING (true);

CREATE POLICY "Creators manage own notes"
  ON public.creator_notes FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── activity_feed ─────────────────────────────────────────────────────────────
CREATE POLICY "Users see own feed"
  ON public.activity_feed FOR ALL USING (user_id = auth.uid());

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ── collabs ───────────────────────────────────────────────────────────────────
CREATE POLICY "Open collabs are public"
  ON public.collabs FOR SELECT USING (status = 'open');

CREATE POLICY "Creators manage own collabs"
  ON public.collabs FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── collab_applications ───────────────────────────────────────────────────────
CREATE POLICY "Collab owner can view applications"
  ON public.collab_applications FOR SELECT
  USING (
    collab_id IN (
      SELECT id FROM public.collabs
      WHERE creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Applicant can view own applications"
  ON public.collab_applications FOR SELECT
  USING (applicant_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "Creators can apply to collabs"
  ON public.collab_applications FOR INSERT
  WITH CHECK (
    applicant_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
    AND collab_id NOT IN (
      SELECT id FROM public.collabs
      WHERE creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Collab owner can update application status"
  ON public.collab_applications FOR UPDATE
  USING (
    collab_id IN (
      SELECT id FROM public.collabs
      WHERE creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Applicant can delete own application"
  ON public.collab_applications FOR DELETE
  USING (applicant_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── tips ──────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view sent tips"
  ON public.tips FOR SELECT USING (from_user_id = auth.uid());

CREATE POLICY "Creators can view received tips"
  ON public.tips FOR SELECT
  USING (to_creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── reports ───────────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can report content"
  ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT USING (reporter_id = auth.uid());

-- ── verification_requests ─────────────────────────────────────────────────────
CREATE POLICY "Creators can submit verification"
  ON public.verification_requests FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

CREATE POLICY "Creators can view own verification"
  ON public.verification_requests FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── live_streams ──────────────────────────────────────────────────────────────
CREATE POLICY "Active live streams are public"
  ON public.live_streams FOR SELECT
  USING (
    status = 'live'
    OR creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

CREATE POLICY "Creators manage own streams"
  ON public.live_streams FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── subscriptions ─────────────────────────────────────────────────────────────
CREATE POLICY "Creators can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── bank_accounts ─────────────────────────────────────────────────────────────
CREATE POLICY "Creators manage own bank accounts"
  ON public.bank_accounts FOR ALL
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── payouts ───────────────────────────────────────────────────────────────────
CREATE POLICY "Creators view own payouts"
  ON public.payouts FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid()));

-- ── badges ────────────────────────────────────────────────────────────────────
CREATE POLICY "Badges are public"
  ON public.badges FOR SELECT USING (true);

CREATE POLICY "System awards badges"
  ON public.badges FOR INSERT WITH CHECK (false);

-- ── canvas_impressions ────────────────────────────────────────────────────────
CREATE POLICY "Users manage own canvas impressions"
  ON public.canvas_impressions FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ── Increment creator works count on publish/unpublish ────────────────────────
CREATE OR REPLACE FUNCTION public.increment_creator_works_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    UPDATE public.creators SET works_count = works_count + 1 WHERE id = NEW.creator_id;
  ELSIF OLD IS NOT NULL AND OLD.status = 'published' AND NEW.status != 'published' THEN
    UPDATE public.creators SET works_count = GREATEST(0, works_count - 1) WHERE id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Increment/decrement heart count ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.works    SET heart_count  = heart_count  + 1 WHERE id = NEW.work_id;
    UPDATE public.creators SET total_hearts = total_hearts + 1
      WHERE id = (SELECT creator_id FROM public.works WHERE id = NEW.work_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.works    SET heart_count  = GREATEST(0, heart_count  - 1) WHERE id = OLD.work_id;
    UPDATE public.creators SET total_hearts = GREATEST(0, total_hearts - 1)
      WHERE id = (SELECT creator_id FROM public.works WHERE id = OLD.work_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Increment/decrement follow count ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_follow_count()
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

-- ── Increment collab application count ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_collab_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collabs SET application_count = application_count + 1 WHERE id = NEW.collab_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Close collabs past deadline (called by cron) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_past_collabs()
RETURNS void AS $$
BEGIN
  UPDATE public.collabs
  SET status = 'closed'
  WHERE status = 'open'
    AND deadline IS NOT NULL
    AND deadline < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Comment heart count ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_comment_heart_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET heart_count = heart_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET heart_count = GREATEST(0, heart_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Fan out new work to followers' activity feed ──────────────────────────────
CREATE OR REPLACE FUNCTION public.fanout_new_work_to_followers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    INSERT INTO public.activity_feed (
      user_id, actor_creator_id, actor_display_name, actor_avatar_url,
      verb, object_type, object_id, object_title, object_thumbnail, object_category
    )
    SELECT
      f.follower_id, c.id, c.display_name, c.avatar_url,
      'published_work', 'work', NEW.id, NEW.title,
      COALESCE(NEW.video_thumbnail, NEW.cover_art_url), NEW.category
    FROM public.follows f
    JOIN public.creators c ON c.id = NEW.creator_id
    WHERE f.following_creator_id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Fan out new creator note to followers' activity feed ──────────────────────
CREATE OR REPLACE FUNCTION public.fanout_new_note_to_followers()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_feed (
    user_id, actor_creator_id, actor_display_name, actor_avatar_url,
    verb, object_type, object_id, object_title
  )
  SELECT
    f.follower_id, c.id, c.display_name, c.avatar_url,
    'published_note', 'note', NEW.id, LEFT(NEW.content, 100)
  FROM public.follows f
  JOIN public.creators c ON c.id = NEW.creator_id
  WHERE f.following_creator_id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Notify creator of new follower ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name   TEXT;
  follower_avatar TEXT;
  creator_user_id UUID;
BEGIN
  SELECT display_name, avatar_url INTO follower_name, follower_avatar
  FROM public.creators WHERE user_id = NEW.follower_id LIMIT 1;

  SELECT user_id INTO creator_user_id
  FROM public.creators WHERE id = NEW.following_creator_id;

  IF creator_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, actor_avatar_url)
    VALUES (
      creator_user_id, 'new_follower',
      COALESCE(follower_name, 'Someone') || ' started following you',
      NULL, follower_avatar
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Notify followers via notifications bell when work published (migration 008)
CREATE OR REPLACE FUNCTION public.notify_followers_on_work_published()
RETURNS TRIGGER AS $$
DECLARE
  creator_display TEXT;
  creator_avatar  TEXT;
  work_thumbnail  TEXT;
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    SELECT display_name, avatar_url INTO creator_display, creator_avatar
    FROM public.creators WHERE id = NEW.creator_id;

    work_thumbnail := COALESCE(NEW.video_thumbnail, NEW.cover_art_url);

    INSERT INTO public.notifications (user_id, type, title, body, actor_avatar_url, metadata)
    SELECT
      f.follower_id,
      'new_work',
      COALESCE(creator_display, 'A creator') || ' posted new ' || REPLACE(NEW.category, '_', ' '),
      NEW.title,
      creator_avatar,
      jsonb_build_object(
        'work_id',    NEW.id,
        'creator_id', NEW.creator_id,
        'thumbnail',  work_thumbnail,
        'category',   NEW.category
      )
    FROM public.follows f
    WHERE f.following_creator_id = NEW.creator_id
    LIMIT 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Badge award helpers (migration 007) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_badge(p_creator_id UUID, p_badge TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.badges(creator_id, badge_type)
  VALUES (p_creator_id, p_badge)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_creator_id UUID)
RETURNS void AS $$
DECLARE c RECORD;
BEGIN
  SELECT * INTO c FROM public.creators WHERE id = p_creator_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF c.works_count    >= 1      THEN PERFORM public.award_badge(p_creator_id, 'first_work'); END IF;
  IF c.works_count    >= 10     THEN PERFORM public.award_badge(p_creator_id, 'works_10'); END IF;
  IF c.works_count    >= 50     THEN PERFORM public.award_badge(p_creator_id, 'works_50'); END IF;

  IF c.total_hearts   >= 100    THEN PERFORM public.award_badge(p_creator_id, 'hearts_100'); END IF;
  IF c.total_hearts   >= 1000   THEN PERFORM public.award_badge(p_creator_id, 'hearts_1000'); END IF;
  IF c.total_hearts   >= 10000  THEN PERFORM public.award_badge(p_creator_id, 'hearts_10000'); END IF;

  IF c.follower_count >= 100    THEN PERFORM public.award_badge(p_creator_id, 'followers_100'); END IF;
  IF c.follower_count >= 1000   THEN PERFORM public.award_badge(p_creator_id, 'followers_1000'); END IF;
  IF c.follower_count >= 10000  THEN PERFORM public.award_badge(p_creator_id, 'followers_10000'); END IF;

  IF c.total_views    >= 1000   THEN PERFORM public.award_badge(p_creator_id, 'views_1000'); END IF;
  IF c.total_views    >= 10000  THEN PERFORM public.award_badge(p_creator_id, 'views_10000'); END IF;
  IF c.total_views    >= 100000 THEN PERFORM public.award_badge(p_creator_id, 'views_100000'); END IF;

  IF c.african_verified         THEN PERFORM public.award_badge(p_creator_id, 'verified_african'); END IF;
  IF c.tips_enabled             THEN PERFORM public.award_badge(p_creator_id, 'tipjar_unlocked'); END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_badge_check()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.check_and_award_badges(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_work_badge_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    PERFORM public.check_and_award_badges(NEW.creator_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Trending score recalculation (migration 009) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.recalculate_trending_scores()
RETURNS void AS $$
BEGIN
  -- Score = weighted engagement × 7-day time decay
  UPDATE public.works
  SET
    trending_score = ROUND(
      (
        (view_count    * 1.0)
      + (heart_count   * 5.0)
      + (comment_count * 10.0)
      + (share_count   * 8.0)
      ) * EXP(
        -0.693 * GREATEST(0,
          EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 86400
        ) / 7.0
      )
    )::float,
    is_trending = false
  WHERE status = 'published';

  -- Mark top 10 per category as trending
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY category ORDER BY trending_score DESC) AS rn
    FROM public.works WHERE status = 'published'
  )
  UPDATE public.works w
  SET is_trending = true
  FROM ranked r
  WHERE w.id = r.id AND r.rn <= 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC helpers (migration 003) ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(p_work_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.works
  SET view_count = view_count + 1
  WHERE id = p_work_id;

  UPDATE public.creators
  SET total_views = total_views + 1
  WHERE id = (SELECT creator_id FROM public.works WHERE id = p_work_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_creator_tips(p_creator_id UUID, p_amount NUMERIC)
RETURNS void AS $$
BEGIN
  -- Earnings tracked via tips table; this is a no-op stub for webhook safety
  UPDATE public.creators SET updated_at = NOW() WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- Drop all first to ensure idempotency, then recreate
-- ============================================================================

DROP TRIGGER IF EXISTS on_work_status_change              ON public.works;
DROP TRIGGER IF EXISTS on_heart_change                    ON public.hearts;
DROP TRIGGER IF EXISTS on_follow_change                   ON public.follows;
DROP TRIGGER IF EXISTS on_collab_application              ON public.collab_applications;
DROP TRIGGER IF EXISTS on_comment_heart_change            ON public.comment_hearts;
DROP TRIGGER IF EXISTS on_work_published_fanout           ON public.works;
DROP TRIGGER IF EXISTS on_creator_note_fanout             ON public.creator_notes;
DROP TRIGGER IF EXISTS on_new_follow_notify               ON public.follows;
DROP TRIGGER IF EXISTS on_creator_stats_badge_check       ON public.creators;
DROP TRIGGER IF EXISTS on_work_published_badge_check      ON public.works;
DROP TRIGGER IF EXISTS on_work_published_notify_followers ON public.works;

-- Works count
CREATE TRIGGER on_work_status_change
  AFTER INSERT OR UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.increment_creator_works_count();

-- Heart count
CREATE TRIGGER on_heart_change
  AFTER INSERT OR DELETE ON public.hearts
  FOR EACH ROW EXECUTE FUNCTION public.update_heart_count();

-- Follow count
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_count();

-- Collab application count
CREATE TRIGGER on_collab_application
  AFTER INSERT ON public.collab_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_collab_application_count();

-- Comment heart count
CREATE TRIGGER on_comment_heart_change
  AFTER INSERT OR DELETE ON public.comment_hearts
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_heart_count();

-- Activity feed fanout on work publish
CREATE TRIGGER on_work_published_fanout
  AFTER INSERT OR UPDATE OF status ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.fanout_new_work_to_followers();

-- Activity feed fanout on creator note
CREATE TRIGGER on_creator_note_fanout
  AFTER INSERT ON public.creator_notes
  FOR EACH ROW EXECUTE FUNCTION public.fanout_new_note_to_followers();

-- Notify creator of new follower
CREATE TRIGGER on_new_follow_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Badge check on creator stat changes
CREATE TRIGGER on_creator_stats_badge_check
  AFTER UPDATE OF total_hearts, follower_count, total_views, works_count,
                  african_verified, tips_enabled
  ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.trigger_badge_check();

-- Badge check on work publish
CREATE TRIGGER on_work_published_badge_check
  AFTER INSERT OR UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.trigger_work_badge_check();

-- Notify followers when work published
CREATE TRIGGER on_work_published_notify_followers
  AFTER INSERT OR UPDATE OF status ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_work_published();

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable Realtime for tables that use live subscriptions in the app
-- ============================================================================

-- Run in Supabase dashboard → Database → Replication if not already enabled:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_notes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;

-- ============================================================================
-- SEED: founding creator badge for first users
-- Uncomment and run AFTER creating your first creator accounts.
-- ============================================================================
-- INSERT INTO public.badges (creator_id, badge_type)
-- SELECT id, 'founding_creator'
-- FROM public.creators
-- ON CONFLICT DO NOTHING;

COMMIT;
