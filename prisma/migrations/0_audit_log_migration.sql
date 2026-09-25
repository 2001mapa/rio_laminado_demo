CREATE TABLE "AuditBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "filename" TEXT,
    "status" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    CONSTRAINT "AuditBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sku" TEXT,
    "orderNumber" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'manual',
    "result" TEXT NOT NULL DEFAULT 'success',
    "batchId" TEXT,
    "changes" JSONB,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "AuditBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
