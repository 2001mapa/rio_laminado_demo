-- Public product URLs keep serving images without a SELECT policy. Only
-- active admins need SELECT to list orphaned photos and upsert existing ones.
DROP POLICY IF EXISTS "Acceso total 1hmvp5f_0" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'RIO admins read and list product photos'
  ) THEN
    CREATE POLICY "RIO admins read and list product photos"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'productos'
      AND (SELECT auth.jwt()->'app_metadata'->>'role') = 'admin'
      AND COALESCE((SELECT auth.jwt()->'app_metadata'->>'adminDisabled'), 'false') <> 'true'
    );
  END IF;
END $$;
