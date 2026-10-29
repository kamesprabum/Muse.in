/*
# Create Daily Coach progress storage

1. New Tables
- `daily_coach_progress`
- `id` (integer, singleton key)
- `completed_tasks` (integer array containing completed task identifiers)
- `streak_days` (integer, current practice streak)
- `updated_at` (timestamp of the last saved change)

2. Security
- Enable row level security on the table.
- Grant read and write access to anonymous and authenticated app visitors.
- Add separate CRUD policies because this is an intentionally shared, single-tenant dashboard with no sign-in requirement.

3. Important Notes
- The singleton row is seeded with the reference experience's 14-day streak and no completed tasks.
- Progress is persisted so task completion survives page refreshes and future visits.
*/

CREATE TABLE IF NOT EXISTS public.daily_coach_progress (
  id integer PRIMARY KEY CHECK (id = 1),
  completed_tasks integer[] NOT NULL DEFAULT '{}',
  streak_days integer NOT NULL DEFAULT 14 CHECK (streak_days >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_coach_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_coach_progress TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read coach progress" ON public.daily_coach_progress;
CREATE POLICY "Public can read coach progress"
  ON public.daily_coach_progress FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create coach progress" ON public.daily_coach_progress;
CREATE POLICY "Public can create coach progress"
  ON public.daily_coach_progress FOR INSERT
  TO anon, authenticated
  WITH CHECK (id = 1);

DROP POLICY IF EXISTS "Public can update coach progress" ON public.daily_coach_progress;
CREATE POLICY "Public can update coach progress"
  ON public.daily_coach_progress FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (id = 1);

DROP POLICY IF EXISTS "Public can delete coach progress" ON public.daily_coach_progress;
CREATE POLICY "Public can delete coach progress"
  ON public.daily_coach_progress FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO public.daily_coach_progress (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;