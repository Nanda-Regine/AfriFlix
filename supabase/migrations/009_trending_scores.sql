-- Migration 009: Trending score calculation
-- Score = weighted sum of recent activity (views, hearts, comments, saves)
-- Decay: 7-day half-life. Runs via Vercel cron daily.

-- Add trending_score column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'works'
       AND column_name  = 'trending_score'
  ) THEN
    ALTER TABLE public.works ADD COLUMN trending_score FLOAT DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS works_trending_score_idx ON public.works(trending_score DESC)
  WHERE status = 'published';

-- Function to recalculate trending scores
-- Called by cron: POST /api/cron/trending
CREATE OR REPLACE FUNCTION recalculate_trending_scores()
RETURNS void AS $$
BEGIN
  -- Score formula (tunable):
  --   base = view_count * 1 + heart_count * 5 + comment_count * 10 + share_count * 8
  --   time_decay = exp( -0.693 * days_since_publish / 7 )
  --   trending_score = base * time_decay
  -- is_trending = score in top 5% or score > threshold
  UPDATE public.works
  SET
    trending_score = ROUND(
      (
        (view_count   * 1.0)
      + (heart_count  * 5.0)
      + (comment_count * 10.0)
      + (share_count  * 8.0)
      ) * EXP(
        -0.693 * GREATEST(0, EXTRACT(EPOCH FROM (NOW() - COALESCE(published_at, created_at))) / 86400) / 7.0
      )
    )::float,
    is_trending = false
  WHERE status = 'published';

  -- Mark top N as trending per category
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY category ORDER BY trending_score DESC) AS rn
      FROM public.works
     WHERE status = 'published'
  )
  UPDATE public.works w
     SET is_trending = true
    FROM ranked r
   WHERE w.id = r.id
     AND r.rn <= 10;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
