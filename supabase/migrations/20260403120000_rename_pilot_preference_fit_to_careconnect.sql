DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pilot_preference_fit_events'
      AND column_name = 'preferred_via_helpbridge'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pilot_preference_fit_events'
      AND column_name = 'preferred_via_careconnect'
  ) THEN
    ALTER TABLE public.pilot_preference_fit_events
      RENAME COLUMN preferred_via_helpbridge TO preferred_via_careconnect;
  END IF;
END $$;
