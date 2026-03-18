-- AfriFlix Phase 3 — Community Layer
-- Tables: activity_feed, creator_notes, notifications
-- Triggers: fan activity notifications, new-work feed fanout

-- ============================================================
-- CREATOR NOTES (short-form posts between full content drops)
-- ============================================================
CREATE TABLE public.creator_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_title TEXT,
  heart_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX creator_notes_creator_idx ON public.creator_notes(creator_id, created_at DESC);

ALTER TABLE public.creator_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator notes are public"
  ON public.creator_notes FOR SELECT USING (true);

CREATE POLICY "Creators manage own notes"
  ON public.creator_notes FOR ALL
  USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- ACTIVITY FEED (fan-specific feed from followed creators)
-- ============================================================
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who this feed entry is FOR (the fan)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Who performed the action
  actor_creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  actor_display_name TEXT NOT NULL,
  actor_avatar_url TEXT,
  -- What happened
  verb TEXT NOT NULL CHECK (verb IN (
    'published_work',
    'published_note',
    'started_collab',
    'milestone'
  )),
  -- What it's about
  object_type TEXT CHECK (object_type IN ('work', 'note', 'collab')),
  object_id UUID,
  object_title TEXT,
  object_thumbnail TEXT,
  object_category TEXT,
  -- Read state
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_feed_user_idx ON public.activity_feed(user_id, created_at DESC);
CREATE INDEX activity_feed_unread_idx ON public.activity_feed(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own feed"
  ON public.activity_feed FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS (direct: tips received, collab accepted, etc.)
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'tip_received',
    'new_follower',
    'collab_application',
    'collab_accepted',
    'comment_on_work',
    'comment_reply',
    'heart_milestone'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actor_avatar_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- COMMENT HEARTS (hearts on comments, separate from work hearts)
-- ============================================================
CREATE TABLE public.comment_hearts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

ALTER TABLE public.comment_hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment hearts are public"
  ON public.comment_hearts FOR SELECT USING (true);

CREATE POLICY "Users manage own comment hearts"
  ON public.comment_hearts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own comment hearts"
  ON public.comment_hearts FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- When a work is published → fan out to all followers' activity feeds
CREATE OR REPLACE FUNCTION fanout_new_work_to_followers()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status becomes 'published'
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    INSERT INTO public.activity_feed (
      user_id,
      actor_creator_id,
      actor_display_name,
      actor_avatar_url,
      verb,
      object_type,
      object_id,
      object_title,
      object_thumbnail,
      object_category
    )
    SELECT
      f.follower_id,
      c.id,
      c.display_name,
      c.avatar_url,
      'published_work',
      'work',
      NEW.id,
      NEW.title,
      COALESCE(NEW.video_thumbnail, NEW.cover_art_url),
      NEW.category
    FROM public.follows f
    JOIN public.creators c ON c.id = NEW.creator_id
    WHERE f.following_creator_id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_work_published_fanout
  AFTER INSERT OR UPDATE OF status ON public.works
  FOR EACH ROW EXECUTE FUNCTION fanout_new_work_to_followers();

-- When a creator note is posted → fan out to followers
CREATE OR REPLACE FUNCTION fanout_new_note_to_followers()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_feed (
    user_id,
    actor_creator_id,
    actor_display_name,
    actor_avatar_url,
    verb,
    object_type,
    object_id,
    object_title
  )
  SELECT
    f.follower_id,
    c.id,
    c.display_name,
    c.avatar_url,
    'published_note',
    'note',
    NEW.id,
    LEFT(NEW.content, 100)
  FROM public.follows f
  JOIN public.creators c ON c.id = NEW.creator_id
  WHERE f.following_creator_id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_creator_note_fanout
  AFTER INSERT ON public.creator_notes
  FOR EACH ROW EXECUTE FUNCTION fanout_new_note_to_followers();

-- When someone follows a creator → notify the creator
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
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
      creator_user_id,
      'new_follower',
      COALESCE(follower_name, 'Someone') || ' started following you',
      NULL,
      follower_avatar
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_follow_notify
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- Auto-maintain comment heart_count
CREATE OR REPLACE FUNCTION update_comment_heart_count()
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

CREATE TRIGGER on_comment_heart_change
  AFTER INSERT OR DELETE ON public.comment_hearts
  FOR EACH ROW EXECUTE FUNCTION update_comment_heart_count();

-- Auto-maintain creator_notes comment_count
CREATE OR REPLACE FUNCTION update_note_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  note_id_ref UUID;
BEGIN
  -- comments table has a content_type concept via work_id — notes need their own
  -- This trigger fires when a comment references a note via note_id (if we add that column)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
