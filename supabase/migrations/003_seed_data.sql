-- =====================================================================
-- Migration 003: Seed data + supporting database functions
-- Inserts the 17 Phase 1 catalogue works + creates helper RPCs
-- =====================================================================

-- ─── Helper: increment creator tips ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_creator_tips(
  p_creator_id UUID,
  p_amount     NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- No-op if creator doesn't exist — webhook may fire before row exists
  UPDATE public.creators
  SET total_hearts = total_hearts  -- placeholder; earnings tracked via tips table
  WHERE id = p_creator_id;
END;
$$;

-- ─── Helper: increment work view count ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(p_work_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.works
  SET view_count = view_count + 1
  WHERE id = p_work_id AND status = 'published';
END;
$$;

-- ─── Helper: update heart count on works after insert/delete ────────────────
CREATE OR REPLACE FUNCTION public.sync_heart_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.works SET heart_count = heart_count + 1 WHERE id = NEW.work_id;
    UPDATE public.creators SET total_hearts = total_hearts + 1
      WHERE id = (SELECT creator_id FROM public.works WHERE id = NEW.work_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.works SET heart_count = GREATEST(heart_count - 1, 0) WHERE id = OLD.work_id;
    UPDATE public.creators SET total_hearts = GREATEST(total_hearts - 1, 0)
      WHERE id = (SELECT creator_id FROM public.works WHERE id = OLD.work_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_heart_count ON public.hearts;
CREATE TRIGGER trg_heart_count
  AFTER INSERT OR DELETE ON public.hearts
  FOR EACH ROW EXECUTE FUNCTION public.sync_heart_count();

-- ─── Helper: update follower/following counts ───────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_follow_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creators SET follower_count = follower_count + 1 WHERE id = NEW.following_creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creators SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_creator_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_count ON public.follows;
CREATE TRIGGER trg_follow_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_follow_count();

-- ─── Helper: update works_count on creator ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_works_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.creators SET works_count = works_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE public.creators SET works_count = works_count + 1 WHERE id = NEW.creator_id;
    ELSIF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE public.creators SET works_count = GREATEST(works_count - 1, 0) WHERE id = NEW.creator_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE public.creators SET works_count = GREATEST(works_count - 1, 0) WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_works_count ON public.works;
CREATE TRIGGER trg_works_count
  AFTER INSERT OR UPDATE OR DELETE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.sync_works_count();

-- ─── Trending cron: update is_trending every 6 hours ────────────────────────
-- Requires pg_cron extension (enable in Supabase dashboard)
-- SELECT cron.schedule('afriflix-trending', '0 */6 * * *', $$
--   UPDATE public.works SET is_trending = false;
--   UPDATE public.works
--   SET is_trending = true
--   WHERE status = 'published'
--     AND published_at > NOW() - INTERVAL '30 days'
--   ORDER BY (view_count * 1.0 + heart_count * 3.0 + comment_count * 2.0) DESC
--   LIMIT 50;
-- $$);

-- ─── Seed creator ────────────────────────────────────────────────────────────
-- We insert a seed creator to attach works to. In production this will be
-- replaced by real creator signups. The UUID is deterministic for idempotency.
INSERT INTO public.creators (
  id, user_id, display_name, username, bio,
  country, categories, languages, cultural_roots,
  is_featured, is_rising, plan,
  follower_count, total_views, total_hearts, works_count,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'AfriFlix Catalogue',
  'afriflix',
  'The official AfriFlix curated catalogue — showcasing the best of African creative storytelling.',
  'South Africa',
  ARRAY['film','poetry']::text[],
  ARRAY['English','Swahili','Yoruba','isiZulu']::text[],
  ARRAY['Pan-African']::text[],
  true, false, 'creator_pro',
  0, 0, 0, 0,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ─── Seed works (17 Phase 1 catalogue items) ─────────────────────────────────
INSERT INTO public.works (
  id, creator_id, title, category, description,
  ai_summary, mood_tags, theme_tags,
  genres, languages, country_of_origin,
  status, is_featured, is_trending,
  view_count, heart_count, comment_count,
  published_at, created_at
) VALUES
-- ── Trending in Africa (film) ──
(
  '10000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'The Weight of Ubuntu', 'film',
  'A Cape Town filmmaker wrestles with collective identity in a fractured post-apartheid neighbourhood.',
  'A Cape Town filmmaker wrestles with collective identity in a fractured post-apartheid neighbourhood, weaving ubuntu philosophy into every aching frame. This is the film South Africa needed to make — and the world needs to see.',
  ARRAY['reflective','melancholic','inspired']::text[],
  ARRAY['ubuntu philosophy','post-apartheid identity','Cape Town','community']::text[],
  ARRAY['Drama','Short film']::text[], ARRAY['English','Afrikaans']::text[], 'South Africa',
  'published', true, true, 8420, 312, 47, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
  '10000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Daughters of Soweto', 'film',
  'Three sisters navigate hustle, love and legacy in contemporary Soweto.',
  'Three sisters navigate hustle, love, and legacy against the pulse of contemporary Soweto — a love letter to Black girlhood that hits like amapiano at 2am. Bold, tender, essential.',
  ARRAY['joyful','inspired','tender']::text[],
  ARRAY['Black girlhood','Soweto','sisterhood','urban Africa']::text[],
  ARRAY['Drama','Web series']::text[], ARRAY['isiZulu','English']::text[], 'South Africa',
  'published', true, true, 6150, 289, 63, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
),
(
  '10000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Lagos After Dark', 'film',
  'A night in Lagos through six strangers whose lives intersect at a crossroads they never expected.',
  'Six strangers collide in Lagos after midnight, their fates tangled in a web of ambition, desire, and survival. Lagos After Dark is Nollywood reborn — sleek, relentless, alive.',
  ARRAY['restless','energised','provocative']::text[],
  ARRAY['Lagos hustle','urban survival','interconnected lives','Nollywood new wave']::text[],
  ARRAY['Thriller','Drama']::text[], ARRAY['English','Yoruba','Pidgin']::text[], 'Nigeria',
  'published', false, true, 9870, 445, 88, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
  '10000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Desert Bloom', 'film',
  'In the Sahara''s edge, a botanist and a nomad discover something neither expected to find.',
  'On the edge of the Sahara, a botanist and a Tuareg nomad discover that the most resilient things grow in the harshest places. Desert Bloom is quiet devastation — the kind that stays with you.',
  ARRAY['reflective','tender','inspired']::text[],
  ARRAY['Sahara','nomadic life','Tuareg culture','unlikely love','climate']::text[],
  ARRAY['Drama','Romance']::text[], ARRAY['French','Tamasheq','English']::text[], 'Mali',
  'published', false, false, 3210, 198, 22, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'
),
(
  '10000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'The Kente Weaver''s Son', 'film',
  'A young Ghanaian man must choose between a UK scholarship and preserving his family''s dying craft.',
  'A young Ghanaian man torn between a London scholarship and the threads of a dying family craft — The Kente Weaver''s Son wraps you in colour, culture, and impossible choices. Breathtaking.',
  ARRAY['melancholic','reflective','inspired']::text[],
  ARRAY['Ghanaian craft tradition','diaspora pull','kente weaving','generational sacrifice']::text[],
  ARRAY['Drama','Short film']::text[], ARRAY['English','Twi']::text[], 'Ghana',
  'published', true, false, 4820, 267, 35, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'
),
(
  '10000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Nairobi Nights', 'film',
  'A Nairobi DJ chases a sound that only exists at 3am — and the producer who can help him find it.',
  'A Nairobi DJ obsessively chases a sound that only exists at 3am, and the underground producer who can unlock it. Nairobi Nights is a love letter to East African club culture — visceral and luminous.',
  ARRAY['energised','joyful','restless']::text[],
  ARRAY['Nairobi nightlife','East African music','creative obsession','urban youth']::text[],
  ARRAY['Drama','Music film']::text[], ARRAY['English','Swahili','Sheng']::text[], 'Kenya',
  'published', false, true, 7640, 388, 74, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
),
-- ── Award-Winning African Cinema (film) ──
(
  '10000000-0000-0000-0000-000000000007'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Roots of Red Clay', 'film',
  'In rural Zimbabwe, a grandmother transmits her lineage''s oral history before the rains come.',
  'In rural Zimbabwe, a grandmother races the rains to transmit 200 years of oral history to a granddaughter who almost forgot to listen. Roots of Red Clay is cinema as ancestral ceremony.',
  ARRAY['reflective','grief-stricken','tender']::text[],
  ARRAY['oral tradition','Zimbabwe','intergenerational memory','Shona culture','elders']::text[],
  ARRAY['Drama','Documentary']::text[], ARRAY['Shona','English']::text[], 'Zimbabwe',
  'published', true, false, 2940, 156, 18, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'
),
(
  '10000000-0000-0000-0000-000000000008'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'When the Baobab Fell', 'film',
  'A village elder''s death unlocks thirty years of silence in a Senegalese community.',
  'A village elder''s death unlocks thirty years of silence and a secret that reshapes an entire Senegalese community''s understanding of itself. When the Baobab Fell is grief weaponised into art.',
  ARRAY['melancholic','grief-stricken','reflective']::text[],
  ARRAY['Senegalese village life','communal grief','secrets','West African storytelling']::text[],
  ARRAY['Drama']::text[], ARRAY['Wolof','French']::text[], 'Senegal',
  'published', false, false, 1870, 134, 12, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
),
(
  '10000000-0000-0000-0000-000000000009'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Letters from Accra', 'film',
  'Found letters between a Ghanaian mother and her migrant daughter span forty years of silence and longing.',
  'Forty years of unanswered letters between a Ghanaian mother and her daughter in London — Letters from Accra reconstructs a love story told entirely in the language of waiting and return.',
  ARRAY['melancholic','tender','reflective']::text[],
  ARRAY['migration','Ghanaian diaspora','mother-daughter bonds','longing','letters']::text[],
  ARRAY['Drama','Period']::text[], ARRAY['English','Twi']::text[], 'Ghana',
  'published', false, false, 2560, 189, 27, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'
),
(
  '10000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'The Griots Remember', 'film',
  'A documentary following three griots across West Africa as their tradition faces extinction.',
  'Three griots across Mali, Gambia, and Senegal carry centuries of history in their voices — and The Griots Remember asks what happens when the last living archive goes silent. Essential, urgent.',
  ARRAY['reflective','grief-stricken','inspired']::text[],
  ARRAY['griot tradition','oral history','West Africa','cultural extinction','storytelling']::text[],
  ARRAY['Documentary']::text[], ARRAY['Mandinka','Wolof','French','English']::text[], 'Mali',
  'published', true, false, 3420, 223, 31, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'
),
(
  '10000000-0000-0000-0000-000000000011'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Zanele', 'film',
  'A Johannesburg teenager discovers her grandmother was a freedom fighter — and what that means for her now.',
  'A Johannesburg teenager discovers her grandmother was a freedom fighter — and that the struggle was never over. Zanele is the coming-of-age story South African cinema has been building toward for decades.',
  ARRAY['inspired','reflective','energised']::text[],
  ARRAY['South African liberation','youth identity','Johannesburg','freedom fighter legacy']::text[],
  ARRAY['Drama','Coming of age']::text[], ARRAY['isiZulu','English']::text[], 'South Africa',
  'published', false, false, 5130, 297, 44, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'
),
(
  '10000000-0000-0000-0000-000000000012'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Maputo Morning', 'film',
  'Dawn breaks over Maputo and five lives begin their day — a symphony of a city waking up.',
  'Dawn breaks over Maputo and five strangers begin their day — a fisherman, a student, a taxi driver, a nurse, a street artist — in a quiet symphony of a city discovering its own beauty. Maputo Morning is light itself.',
  ARRAY['joyful','tender','celebratory']::text[],
  ARRAY['Maputo','Mozambique','city life','everyday beauty','African urbanity']::text[],
  ARRAY['Drama','Slice of life']::text[], ARRAY['Portuguese','Shangana']::text[], 'Mozambique',
  'published', false, false, 2180, 167, 14, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'
),
-- ── Spoken Word & Poetry ──
(
  '10000000-0000-0000-0000-000000000013'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Voices of the Cape', 'poetry',
  'Five Cape Town slam poets perform at the edge of the sea — language as resistance, as homecoming.',
  'Five Cape Town slam poets at the edge of the Atlantic — their words are resistance, homecoming, and fury braided into something that sounds like love. Voices of the Cape will undo you.',
  ARRAY['inspired','reflective','energised']::text[],
  ARRAY['Cape Town','slam poetry','Cape Malay identity','coloured identity','the Cape']::text[],
  ARRAY['Slam','Spoken word']::text[], ARRAY['English','Afrikaans','Cape Malay']::text[], 'South Africa',
  'published', true, false, 4210, 334, 56, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'
),
(
  '10000000-0000-0000-0000-000000000014'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Harare Haiku', 'poetry',
  'A Zimbabwean poet compresses a nation''s grief and defiance into seventeen syllables at a time.',
  'A Zimbabwean poet compresses a nation''s grief and quiet defiance into seventeen syllables at a time — Harare Haiku is proof that the smallest form can hold the largest wound.',
  ARRAY['melancholic','reflective','grief-stricken']::text[],
  ARRAY['Zimbabwe','Harare','haiku','political grief','restraint']::text[],
  ARRAY['Written poetry','Haiku']::text[], ARRAY['English','Shona']::text[], 'Zimbabwe',
  'published', false, false, 1540, 198, 22, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'
),
(
  '10000000-0000-0000-0000-000000000015'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'The Last Griot Standing', 'poetry',
  'A spoken word performance that channels griot tradition into the present moment — and refuses to let it die.',
  'A spoken word performance that channels 700 years of griot tradition into a single electric present-tense moment — and refuses to let any of it die. The Last Griot Standing is defiance as art form.',
  ARRAY['energised','inspired','celebratory']::text[],
  ARRAY['griot tradition','West African oral poetry','cultural preservation','ancestral pride']::text[],
  ARRAY['Spoken word','Performance']::text[], ARRAY['English','Mandinka']::text[], 'Gambia',
  'published', false, true, 3870, 287, 38, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'
),
(
  '10000000-0000-0000-0000-000000000016'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Blood and Bougainvillea', 'poetry',
  'A Nigerian poet writes about Biafra through the flowers her grandmother grew — memory as a garden.',
  'A Nigerian poet excavates the Biafra war through the bougainvillea her grandmother planted and never explained — Blood and Bougainvillea is memory as a garden you''re finally allowed to enter.',
  ARRAY['melancholic','tender','grief-stricken']::text[],
  ARRAY['Biafra','Nigerian history','memory','flowers as metaphor','Igbo women']::text[],
  ARRAY['Written poetry','Lyric essay']::text[], ARRAY['English','Igbo']::text[], 'Nigeria',
  'published', false, false, 2340, 245, 29, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'
),
(
  '10000000-0000-0000-0000-000000000017'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'She Spoke Mountains', 'poetry',
  'A Rwandan poet processes genocide, survival, and the impossible act of passing peace to her children.',
  'A Rwandan poet processes genocide, survival, and the impossible, necessary act of passing peace to her children — She Spoke Mountains is the most important poem you will hear this year.',
  ARRAY['grief-stricken','tender','inspired']::text[],
  ARRAY['Rwandan genocide','survival','motherhood','intergenerational trauma','reconciliation']::text[],
  ARRAY['Spoken word','Trauma poetry']::text[], ARRAY['Kinyarwanda','French','English']::text[], 'Rwanda',
  'published', true, false, 5640, 489, 71, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
)
ON CONFLICT (id) DO NOTHING;

-- Update the seed creator's works_count to match
UPDATE public.creators
SET works_count = (
  SELECT COUNT(*) FROM public.works
  WHERE creator_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND status = 'published'
)
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
