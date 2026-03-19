-- Migration 008: Notify followers via notifications table when creator publishes new work
-- Previously only activity_feed was updated; now also push to notifications for the bell

CREATE OR REPLACE FUNCTION notify_followers_on_work_published()
RETURNS TRIGGER AS $$
DECLARE
  creator_display TEXT;
  creator_avatar  TEXT;
  work_thumbnail  TEXT;
BEGIN
  -- Only trigger when status transitions to 'published'
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN

    SELECT c.display_name, c.avatar_url
      INTO creator_display, creator_avatar
      FROM public.creators c
     WHERE c.id = NEW.creator_id;

    work_thumbnail := COALESCE(NEW.video_thumbnail, NEW.cover_art_url);

    -- Insert notification for each follower (cap at 1000 to avoid mass inserts on large accounts)
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

-- Drop if exists from any prior version, then recreate
DROP TRIGGER IF EXISTS on_work_published_notify_followers ON public.works;

CREATE TRIGGER on_work_published_notify_followers
  AFTER INSERT OR UPDATE OF status ON public.works
  FOR EACH ROW EXECUTE FUNCTION notify_followers_on_work_published();

-- Also add metadata column to notifications if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'notifications'
       AND column_name  = 'metadata'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Update notifications table to add work_id link column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'notifications'
       AND column_name  = 'link_url'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN link_url TEXT;
  END IF;
END $$;
