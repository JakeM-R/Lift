-- ─── Table-level GRANTs ──────────────────────────────────────────────────────
-- RLS policies control row visibility; these GRANTs allow the roles to access
-- the tables at all. Without both, queries return "permission denied".

GRANT SELECT ON exercises TO anon, authenticated;
GRANT ALL ON templates TO authenticated;
GRANT ALL ON template_exercises TO authenticated;
GRANT ALL ON workouts TO authenticated;
GRANT ALL ON workout_sets TO authenticated;
GRANT ALL ON body_measurements TO authenticated;
GRANT ALL ON user_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION finish_workout(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION init_user_preferences(uuid) TO authenticated;

-- Ensure tables created in the future get the same treatment
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
