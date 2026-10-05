import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuditEvents, getAuditGroupDetails } from '@/app/actions/audit'

const db = vi.hoisted(() => ({ queryRaw: vi.fn(), findMany: vi.fn() }))

vi.mock('@/utils/auth-helpers', () => ({ requireRole: vi.fn().mockResolvedValue({ role: 'admin' }) }))
vi.mock('@/lib/prisma', () => ({ prisma: {
  $queryRaw: db.queryRaw,
  auditEvent: { findMany: db.findMany },
} }))

describe('historial agrupado sin alterar la auditoría', () => {
  beforeEach(() => vi.clearAllMocks())

  it('presenta una jornada de fotos como una fila y pagina por grupos', async () => {
    const createdAt = new Date('2026-10-05T15:00:00Z')
    db.queryRaw.mockResolvedValueOnce([{
      groupKey: 'photo:admin-1:2026-10-05', latestId: 'photo-2', createdAt,
      count: 3, successfulPhotos: 2, failedPhotos: 0, actorCount: 1, totalGroups: 51,
    }])
    db.findMany.mockResolvedValueOnce([{
      id: 'photo-2', action: 'BULK_PHOTO_UPLOAD', actorName: 'Admin', createdAt,
    }])

    const result = await getAuditEvents({ page: 1 })
    expect(result.success).toBe(true)
    expect(result.totalPages).toBe(2)
    expect(result.events).toEqual([expect.objectContaining({
      id: 'photo:admin-1:2026-10-05', groupType: 'photo', successfulPhotos: 2,
    })])
    expect(db.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['photo-2'] } },
    }))
  })

  it('mantiene el detalle original de cada cambio de estado y limita su lectura', async () => {
    db.queryRaw.mockResolvedValueOnce([{ id: 'status-2' }, { id: 'status-1' }])
    db.findMany.mockResolvedValueOnce([
      { id: 'status-1', changes: { previousStatus: 'Reservado', nextStatus: 'Confirmado' } },
      { id: 'status-2', changes: { previousStatus: 'Confirmado', nextStatus: 'Despachado' } },
    ])

    const result = await getAuditGroupDetails('status:order-1', {}, 0)
    expect(result.success).toBe(true)
    expect(result.events.map(event => event.id)).toEqual(['status-2', 'status-1'])
    expect(result.hasMore).toBe(false)
  })
})
