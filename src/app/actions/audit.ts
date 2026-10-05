'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'

type AuditFilters = { page?: number; search?: string; type?: string; date?: string }

// Solo se agrupa la lectura: cada evento original de auditoría permanece intacto.
const groupKeySql = Prisma.sql`CASE
  WHEN e."action" IN ('UPLOAD_PHOTO', 'BULK_PHOTO_UPLOAD')
    THEN 'photo:' || e."actorId" || ':' || to_char(e."createdAt" AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD')
  WHEN e."action" = 'STATUS_CHANGE' AND e."entityType" = 'ORDER'
    THEN 'status:' || e."entityId"
  ELSE 'event:' || e."id"
END`

function filterClauses({ search = '', type = '', date = '' }: AuditFilters) {
  const clauses: Prisma.Sql[] = []
  const term = search.trim().slice(0, 120)
  if (term) {
    const pattern = `%${term}%`
    clauses.push(Prisma.sql`(e."sku" ILIKE ${pattern} OR e."orderNumber" ILIKE ${pattern} OR e."actorName" ILIKE ${pattern} OR e."entityId" ILIKE ${pattern})`)
  }

  if (type === 'UPLOAD_PHOTO') clauses.push(Prisma.sql`e."action" IN ('UPLOAD_PHOTO', 'BULK_PHOTO_UPLOAD')`)
  else if (['CREATE', 'UPDATE', 'DELETE'].includes(type)) clauses.push(Prisma.sql`e."action" LIKE ${`${type}%`}`)
  else if (type === 'STATUS_CHANGE' || type === 'LOGIN') clauses.push(Prisma.sql`e."action" = ${type}`)

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00-05:00`)
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
      clauses.push(Prisma.sql`e."createdAt" >= ${start} AND e."createdAt" < ${end}`)
    }
  }
  return clauses
}

type GroupRow = {
  groupKey: string
  createdAt: Date
  latestId: string
  count: number
  successfulPhotos: number
  failedPhotos: number
  actorCount: number
  totalGroups: number
}

export async function getAuditEvents(filters: AuditFilters) {
  try {
    await requireRole(['admin'])
    const requestedPage = Number.isFinite(filters.page) ? Math.floor(filters.page!) : 1
    const page = Math.max(1, Math.min(100000, requestedPage))
    const clauses = filterClauses(filters)
    const where = clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.empty
    const rows = await prisma.$queryRaw<GroupRow[]>`
      WITH filtered AS (
        SELECT e."id", e."createdAt", e."actorId", e."action", e."result", ${groupKeySql} AS "groupKey"
        FROM "AuditEvent" e ${where}
      ), grouped AS (
        SELECT "groupKey", MAX("createdAt") AS "createdAt",
          (array_agg("id" ORDER BY "createdAt" DESC, "id" DESC))[1] AS "latestId",
          COUNT(*)::int AS "count",
          COUNT(DISTINCT "actorId")::int AS "actorCount",
          COUNT(*) FILTER (WHERE "action" = 'UPLOAD_PHOTO' AND "result" = 'success')::int AS "successfulPhotos",
          COUNT(*) FILTER (WHERE "action" = 'UPLOAD_PHOTO' AND "result" <> 'success')::int AS "failedPhotos"
        FROM filtered GROUP BY "groupKey"
      )
      SELECT *, COUNT(*) OVER()::int AS "totalGroups"
      FROM grouped ORDER BY "createdAt" DESC, "groupKey" DESC
      LIMIT 50 OFFSET ${(page - 1) * 50}
    `

    const latestEvents = await prisma.auditEvent.findMany({
      where: { id: { in: rows.map(row => row.latestId) } },
      include: { batch: true },
    })
    const byId = new Map(latestEvents.map(event => [event.id, event]))
    const events = rows.flatMap(row => {
      const latest = byId.get(row.latestId)
      if (!latest) return []
      const groupType = row.groupKey.startsWith('photo:') ? 'photo' : row.groupKey.startsWith('status:') ? 'status' : null
      return [{
        ...latest,
        id: row.groupKey,
        createdAt: row.createdAt,
        groupType,
        groupCount: row.count,
        successfulPhotos: row.successfulPhotos,
        failedPhotos: row.failedPhotos,
        result: groupType === 'photo' && row.failedPhotos > 0
          ? (row.successfulPhotos > 0 ? 'warning' : 'error')
          : latest.result,
        actorName: row.actorCount > 1 ? 'Varios usuarios' : latest.actorName,
      }]
    })

    return { success: true, events, totalPages: Math.ceil((rows[0]?.totalGroups || 0) / 50) || 1 }
  } catch (error) {
    console.error('Error fetching audit events:', error)
    return { success: false, error: 'Failed to fetch audit events', events: [], totalPages: 1 }
  }
}

export async function getAuditGroupDetails(groupKey: string, filters: AuditFilters, offset = 0) {
  try {
    await requireRole(['admin'])
    if (!groupKey || groupKey.length > 200 || !/^(photo|status):/.test(groupKey)) {
      return { success: false, events: [], hasMore: false }
    }
    const clauses = [...filterClauses(filters), Prisma.sql`${groupKeySql} = ${groupKey}`]
    const requestedOffset = Number.isFinite(offset) ? Math.floor(offset) : 0
    const safeOffset = Math.max(0, Math.min(100000, requestedOffset))
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT e."id" FROM "AuditEvent" e
      WHERE ${Prisma.join(clauses, ' AND ')}
      ORDER BY e."createdAt" DESC, e."id" DESC
      LIMIT 101 OFFSET ${safeOffset}
    `
    const visibleIds = ids.slice(0, 100).map(row => row.id)
    const events = await prisma.auditEvent.findMany({
      where: { id: { in: visibleIds } },
      include: { batch: true },
    })
    const byId = new Map(events.map(event => [event.id, event]))
    return { success: true, events: visibleIds.flatMap(id => byId.get(id) || []), hasMore: ids.length > 100 }
  } catch (error) {
    console.error('Error fetching audit group details:', error)
    return { success: false, events: [], hasMore: false }
  }
}
