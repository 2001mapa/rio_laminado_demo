-- Prisma uses the postgres database role; it bypasses RLS. Browser-facing
-- anon/authenticated roles retain no grants on these application tables.
ALTER TABLE "public"."AuditBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderMaterialGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Seller" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Product images remain publicly readable. Uploads (including upserts),
-- replacements and deletions are restricted to active admin JWTs.
DROP POLICY IF EXISTS "Acceso total 1hmvp5f_1" ON storage.objects;
DROP POLICY IF EXISTS "Acceso total 1hmvp5f_2" ON storage.objects;
DROP POLICY IF EXISTS "Acceso total 1hmvp5f_3" ON storage.objects;

CREATE POLICY "RIO admins insert product photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'productos'
  AND (SELECT auth.jwt()->'app_metadata'->>'role') = 'admin'
  AND COALESCE((SELECT auth.jwt()->'app_metadata'->>'adminDisabled'), 'false') <> 'true'
);

CREATE POLICY "RIO admins update product photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'productos'
  AND (SELECT auth.jwt()->'app_metadata'->>'role') = 'admin'
  AND COALESCE((SELECT auth.jwt()->'app_metadata'->>'adminDisabled'), 'false') <> 'true'
)
WITH CHECK (
  bucket_id = 'productos'
  AND (SELECT auth.jwt()->'app_metadata'->>'role') = 'admin'
  AND COALESCE((SELECT auth.jwt()->'app_metadata'->>'adminDisabled'), 'false') <> 'true'
);

CREATE POLICY "RIO admins delete product photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'productos'
  AND (SELECT auth.jwt()->'app_metadata'->>'role') = 'admin'
  AND COALESCE((SELECT auth.jwt()->'app_metadata'->>'adminDisabled'), 'false') <> 'true'
);
