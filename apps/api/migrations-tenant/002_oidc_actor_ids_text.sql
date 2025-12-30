DO $$
BEGIN
  -- OIDC subject identifiers are not guaranteed to be UUIDs.
  ALTER TABLE reports
    ALTER COLUMN created_by_user_id TYPE TEXT USING created_by_user_id::text,
    ALTER COLUMN approved_by_user_id TYPE TEXT USING approved_by_user_id::text;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE audit_log
    ALTER COLUMN actor_user_id TYPE TEXT USING actor_user_id::text;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
  WHEN undefined_column THEN
    NULL;
END $$;



