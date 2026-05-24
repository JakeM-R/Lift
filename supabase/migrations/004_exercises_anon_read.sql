-- Allow anon role to read seeded exercises
-- Seeded exercises are public data (generic exercise library) — no auth needed to view
drop policy if exists "exercises_read_seeded" on exercises;

create policy "exercises_read_seeded"
  on exercises for select
  to anon, authenticated
  using (created_by is null);
