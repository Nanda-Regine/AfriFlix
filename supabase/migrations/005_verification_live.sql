-- AfriFlix Phase 3 — African identity verification + live streaming tables

-- ============================================================
-- VERIFICATION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('id_document', 'social_link', 'community_voucher')),

  -- Evidence
  id_document_url TEXT,             -- R2 URL of uploaded ID (handled server-side only)
  social_proof_url TEXT,            -- Link to African social media / bio link
  voucher_creator_id UUID REFERENCES public.creators(id),  -- Vouched by existing verified creator

  notes TEXT,                       -- Applicant notes
  admin_notes TEXT,                 -- Reviewer notes
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX verify_creator_idx ON public.verification_requests(creator_id, status);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can submit verification"
  ON public.verification_requests FOR INSERT
  WITH CHECK (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

CREATE POLICY "Creators can view own verification"
  ON public.verification_requests FOR SELECT
  USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- LIVE STREAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cloudflare_live_uid TEXT NOT NULL,
  rtmps_url TEXT,
  rtmps_key TEXT,               -- Encrypted at rest via Supabase Vault (or store hashed)
  webrtc_url TEXT,
  status TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'live', 'ended')),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX live_streams_creator_idx ON public.live_streams(creator_id, status);
CREATE INDEX live_streams_live_idx    ON public.live_streams(status, viewer_count DESC);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active live streams are public"
  ON public.live_streams FOR SELECT
  USING (status = 'live' OR creator_id IN (
    SELECT id FROM public.creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators manage own streams"
  ON public.live_streams FOR ALL
  USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- pgvector — enable extension + embedding column
-- Requires pgvector extension enabled on your Supabase project
-- Enable at: Supabase dashboard → Database → Extensions → vector
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ALTER TABLE public.works ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- CREATE INDEX works_embedding_idx ON public.works
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- Semantic search RPC
-- CREATE OR REPLACE FUNCTION semantic_search(
--   query_embedding VECTOR(1536),
--   match_threshold FLOAT DEFAULT 0.7,
--   match_count INT DEFAULT 20
-- )
-- RETURNS TABLE (
--   id UUID,
--   title TEXT,
--   category TEXT,
--   similarity FLOAT
-- )
-- LANGUAGE sql STABLE
-- AS $$
--   SELECT
--     id, title, category,
--     1 - (embedding <=> query_embedding) AS similarity
--   FROM public.works
--   WHERE
--     status = 'published'
--     AND 1 - (embedding <=> query_embedding) > match_threshold
--   ORDER BY embedding <=> query_embedding
--   LIMIT match_count;
-- $$;

-- Full-text search index (available now, no extensions needed)
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(ai_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(cultural_origin, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS works_fts_idx ON public.works USING GIN(search_vector);

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS creators_fts_idx ON public.creators USING GIN(search_vector);
