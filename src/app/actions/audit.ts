'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'

export async function getAuditEvents({ 
  page = 1, 
  search = '', 
  type = '', 
  date = '' 
}: { 
  page?: number, 
  search?: string, 
  type?: string, 
  date?: string 
}) {
  try {
    await requireRole(['admin']);

    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { actorName: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.action = type;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const total = await prisma.auditEvent.count({ where });
    const events = await prisma.auditEvent.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        batch: true,
      }
    });

    return {
      success: true,
      events,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error('Error fetching audit events:', error);
    return { success: false, error: 'Failed to fetch audit events', events: [], totalPages: 1 };
  }
}
