-- AfriFlix Phase 2 — Security fixes migration
-- Fixes:
--   1. Hearts INSERT policy used USING instead of WITH CHECK (allowed wrong user to insert)
--   2. collab_applications had no RLS — any auth'd user could read all applications
--   3. tips had no RLS — any auth'd user could read all tip transactions
--   4. reports had no RLS — any auth'd user could read moderation reports

-- ============================================================
-- 1. Hearts — fix INSERT policy (USING → WITH CHECK)
-- ============================================================
DROP POLICY IF EXISTS "Users manage own hearts" ON public.hearts;

CREATE POLICY "Users manage own hearts"
  ON public.hearts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. collab_applications — enable RLS + scoped policies
-- ============================================================
ALTER TABLE public.collab_applications ENABLE ROW LEVEL SECURITY;

-- Collab owner can see all applications to their listings
CREATE POLICY "Collab owner can view applications"
  ON public.collab_applications FOR SELECT
  USING (
    collab_id IN (
      SELECT id FROM public.collabs
      WHERE creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
      )
    )
  );

-- Applicant can see their own applications
CREATE POLICY "Applicant can view own applications"
  ON public.collab_applications FOR SELECT
  USING (
    applicant_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Creators can submit applications (not to their own listings)
CREATE POLICY "Creators can apply to collabs"
  ON public.collab_applications FOR INSERT
  WITH CHECK (
    applicant_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
    -- Cannot apply to own collab listing
    AND collab_id NOT IN (
      SELECT id FROM public.collabs
      WHERE creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
      )
    )
  );

-- Collab owner can update application status (shortlist/accept/decline)
CREATE POLICY "Collab owner can update application status"
  ON public.collab_applications FOR UPDATE
  USING (
    collab_id IN (
      SELECT id FROM public.collabs
      WHERE creator_id IN (
        SELECT id FROM public.creators WHERE user_id = auth.uid()
      )
    )
  );

-- Applicant can withdraw (delete) own application
CREATE POLICY "Applicant can delete own application"
  ON public.collab_applications FOR DELETE
  USING (
    applicant_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. tips — enable RLS + scoped policies
-- ============================================================
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Sender can see tips they sent
CREATE POLICY "Users can view sent tips"
  ON public.tips FOR SELECT
  USING (from_user_id = auth.uid());

-- Creator can see tips they received
CREATE POLICY "Creators can view received tips"
  ON public.tips FOR SELECT
  USING (
    to_creator_id IN (
      SELECT id FROM public.creators WHERE user_id = auth.uid()
    )
  );

-- Only our API (service role) creates tip records — no direct client INSERT allowed
-- Webhooks use service role key and bypass RLS, so no INSERT policy needed for anon/auth roles

-- ============================================================
-- 4. reports — enable RLS + scoped policies
-- ============================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a report
CREATE POLICY "Authenticated users can report content"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Users can view their own submitted reports (for status tracking)
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

-- No UPDATE/DELETE policies — reports are managed by admins via service role only
