'use server';

class BusinessLogicError extends Error {
  code: string;
  conflicts?: any[];
  constructor(msg: string, code = 'BUSINESS_ERROR', conflicts?: any[]) {
    super(msg);
    this.name = 'BusinessLogicError';
    this.code = code;
    this.conflicts = conflicts;
  }
}

import { unstable_noStore as noStore } from 'next/cache';
import { OrderTransitionAction, getNextState } from '@/lib/order-status';

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/utils/auth-helpers'
import { logAuditEvent, getAuditActor } from '@/lib/audit'

export async function createOrder(data: {
  customerId?: string; // Solo requerido/confiado si es vendedor o admin
  items: { productId: string; quantity: number; expectedPrice?: number; sizeDetails?: { size: string, quantity: number }[] }[];
  clientRequestId?: string;
    newCustomerData?: { name: string, phone: string, city: string, address: string, email?: string };
  }) {
  const { user, role } = await requireRole(['cliente', 'vendedor', 'admin']);
  
  try {
    let finalCustomerId: string;
    let finalSellerId: string | null = null;
    let discount = 0;

    // 1. Resolver identidades de forma segura
    if (role === 'cliente') {
      const customer = await prisma.customer.findUnique({ where: { authUserId: user.id } });
      if (!customer) throw new BusinessLogicError('Perfil de cliente no encontrado');
      finalCustomerId = customer.id;
      // Para pedidos directos de cliente, sellerId siempre es null
    } else {
      if (!data.customerId) throw new BusinessLogicError('Se requiere el ID del cliente para crear el pedido');
      finalCustomerId = data.customerId;
      
      if (role === 'vendedor') {
        const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
        if (!seller) throw new BusinessLogicError('Perfil de vendedor no encontrado');
        if (seller.status !== 'active') throw new BusinessLogicError('Cuenta de vendedor suspendida');
        finalSellerId = seller.id;
      }
    }

    if (!data.items || data.items.length === 0) {
      throw new BusinessLogicError('El pedido debe tener al menos un articulo.');
    }

    // Helper for Idempotency Content Verification
    const verifyIdempotentContent = (existingOrder: any) => {
      // Si el pedido original era de un cliente nuevo, su ID guardado será el uuid real asignado, no 'NEW_CUSTOMER'.
      // En ese caso, la aserción de igualdad estricta fallaría. Validamos condicionalmente:
      if (finalCustomerId === 'NEW_CUSTOMER') {
        if (existingOrder.sellerId !== finalSellerId) {
          throw new BusinessLogicError('Identificador de solicitud inválido: colisión de vendedor.');
        }
      } else {
        if (existingOrder.customerId !== finalCustomerId || existingOrder.sellerId !== finalSellerId) {
          throw new BusinessLogicError('Identificador de solicitud inválido o colisión de petición.');
        }
      }
      
      let originalItems = existingOrder.items;
      if (existingOrder.originalPayload) {
        if (Array.isArray(existingOrder.originalPayload)) originalItems = existingOrder.originalPayload;
        else if (typeof existingOrder.originalPayload === 'object' && existingOrder.originalPayload.items) originalItems = existingOrder.originalPayload.items;
      }
      
      if (finalCustomerId === 'NEW_CUSTOMER' && existingOrder.originalPayload && !Array.isArray(existingOrder.originalPayload) && existingOrder.originalPayload.newCustomerData) {
         const storedNewCust = existingOrder.originalPayload.newCustomerData;
         if (data.newCustomerData) {
             if (storedNewCust.name !== data.newCustomerData.name || storedNewCust.phone !== data.newCustomerData.phone || storedNewCust.city !== data.newCustomerData.city || storedNewCust.address !== data.newCustomerData.address) {
                 throw new BusinessLogicError('Identificador de solicitud utilizado con distintos datos de cliente nuevo.');
             }
         }
      }
      
      if (originalItems.length !== data.items.length) {
        throw new BusinessLogicError('El identificador de solicitud ya fue utilizado para un pedido con distinto contenido.');
      }
      
      const pool = [...originalItems];
      for (const sentItem of data.items) {
        const matchIndex = pool.findIndex((ei: any) => {
           if (ei.productId !== sentItem.productId || ei.quantity !== sentItem.quantity) return false;
           if (sentItem.sizeDetails && sentItem.sizeDetails.length > 0) {
               if (!ei.sizeDetails || ei.sizeDetails.length !== sentItem.sizeDetails.length) return false;
               for (const sizeInfo of sentItem.sizeDetails) {
                   const sizeMatch = ei.sizeDetails.find((s: any) => s.size === sizeInfo.size && s.quantity === sizeInfo.quantity);
                   if (!sizeMatch) return false;
               }
           } else if (ei.sizeDetails && ei.sizeDetails.length > 0) {
               return false;
           }
           return true;
        });

        if (matchIndex === -1) {
           throw new BusinessLogicError('El identificador de solicitud ya fue utilizado para un pedido con distinto contenido.');
        }
        
        // Remove matched item to handle exact duplicate instances safely
        pool.splice(matchIndex, 1);
      }
      return true;
    };

    // Validación de Venta Rápida
      if (finalCustomerId === 'NEW_CUSTOMER') {
        if (!data.newCustomerData) throw new BusinessLogicError('Faltan datos del cliente nuevo');
        if (!data.newCustomerData.name || !data.newCustomerData.phone || !data.newCustomerData.city || !data.newCustomerData.address) {
          throw new BusinessLogicError('Nombre, teléfono, ciudad y dirección son obligatorios para cliente nuevo');
        }
        if (data.newCustomerData.email) {
          data.newCustomerData.email = data.newCustomerData.email.trim().toLowerCase();
        }
      }

      // 2. Verificación de Idempotencia PRE-creación
    if (data.clientRequestId) {
      const existingOrder = await prisma.order.findUnique({
        where: { clientRequestId: data.clientRequestId },
        include: { items: true, groups: { include: { items: true } } }
      });
      
      if (existingOrder) {
        verifyIdempotentContent(existingOrder);
        return { success: true, order: { ...existingOrder, number: existingOrder.orderNumber } };
      }
    }

    // Obtener detalles del cliente para aplicar descuentos reales
    if (finalCustomerId !== 'NEW_CUSTOMER') {
      const targetCustomer = await prisma.customer.findUnique({ where: { id: finalCustomerId } });
      if (!targetCustomer) throw new BusinessLogicError('Cliente objetivo no encontrado');
      if (targetCustomer.showDiscount) {
        discount = targetCustomer.discount / 100;
      }
    }

    // Retry loop for unique constraint violations
    const MAX_RETRIES = 3;
    let attempt = 0;
    let order;

    while (attempt < MAX_RETRIES) {
      try {
        order = await prisma.$transaction(async (tx) => {
            let actualCustomerId = finalCustomerId;
            if (actualCustomerId === 'NEW_CUSTOMER' && data.newCustomerData) {
               const newCust = await tx.customer.create({
                  data: {
                      name: data.newCustomerData.name,
                      phone: data.newCustomerData.phone,
                      city: data.newCustomerData.city,
                      address: data.newCustomerData.address,
                      email: data.newCustomerData.email || null,
                      internalSystemStatus: 'Pendiente'
                  }
               });
               actualCustomerId = newCust.id;
            }

            let subtotal = 0;
            const orderItemsByMaterial: Record<string, any[]> = {};
            const conflicts: any[] = [];

                        // Primera pasada: Validaciones
            for (const item of data.items) {
              if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new BusinessLogicError('Cantidad inválida.');
              }
              const product = await tx.product.findUnique({ where: { id: item.productId } });
              if (!product || !product.isActive) {
                conflicts.push({ productId: item.productId, reason: 'Producto inactivo o eliminado', currentStock: 0 });
                continue;
              }
              if (!product.material || product.material === 'Por revisar') {
                conflicts.push({ productId: item.productId, reason: 'Material no definido', currentStock: 0 });
                continue;
              }
              if (item.expectedPrice !== undefined && product.price !== item.expectedPrice) {
                conflicts.push({ productId: product.id, reason: 'El precio ha cambiado', currentPrice: product.price, currentStock: product.physicalStock - product.reservedStock });
                continue;
              }
              if (product.category === 'Anillos') {
                 if (!item.sizeDetails || item.sizeDetails.length === 0) {
                    throw new BusinessLogicError(`El anillo ${product.name} requiere al menos una talla.`);
                 }
                 const sum = item.sizeDetails.reduce((a, b) => a + b.quantity, 0);
                 if (sum !== item.quantity) {
                    throw new BusinessLogicError(`La suma de las tallas (${sum}) no coincide con la cantidad total (${item.quantity}) para el anillo ${product.name}.`);
                 }
              } else if (item.sizeDetails && item.sizeDetails.length > 0 && product.category !== 'Anillos') {
                 throw new BusinessLogicError(`El producto ${product.name} no es un anillo, no puede llevar desglose de tallas.`);
              }
              const available = product.physicalStock - product.reservedStock;
              if (item.quantity > available) {
                conflicts.push({ productId: product.id, reason: 'Stock insuficiente', currentStock: available, currentPrice: product.price });
                continue;
              }
            }
            if (conflicts.length > 0) {
              throw new BusinessLogicError("Conflictos en el inventario o precios.", 'CONFLICT_ERROR', conflicts);
            }

            for (const item of data.items) {
              const product = await tx.product.findUnique({ where: { id: item.productId } });
              if (!product) continue;
              const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: { reservedStock: { increment: item.quantity } }
              });
              if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
                throw new BusinessLogicError("Conflicto de concurrencia: Stock agotado para " + product.name, 'CONFLICT_ERROR', [{ productId: product.id, reason: 'Stock insuficiente', currentStock: 0 }]);
              }
              const price = product.price;
              subtotal += price * item.quantity;
              
              const mat = product.material || 'Otro';
              if (!orderItemsByMaterial[mat]) orderItemsByMaterial[mat] = [];
              orderItemsByMaterial[mat].push({
                productId: product.id,
                quantity: item.quantity,
                priceAtTime: price,
                materialSnapshot: mat,
                sizeDetails: item.sizeDetails || undefined
              });
            }
            
            const totalAmount = subtotal * (1 - discount);
            
            const prefix = finalSellerId ? 'VEN' : 'WEB';
            const lastOrder = await tx.order.findFirst({
              where: { orderNumber: { startsWith: `${prefix}-` } },
              orderBy: { createdAt: 'desc' }
            });
            
            let nextNumber = 1;
            if (lastOrder) {
              const parts = lastOrder.orderNumber.split('-');
              if (parts.length === 2) {
                const num = parseInt(parts[1], 10);
                if (!isNaN(num)) nextNumber = num + 1;
              }
            }
            
            const orderNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;

            const newOrder = await tx.order.create({
              data: {
                orderNumber,
                clientRequestId: data.clientRequestId || undefined,
                originalPayload: { items: data.items, newCustomerData: data.newCustomerData } as any,
                customerId: actualCustomerId,
                sellerId: finalSellerId,
                status: 'Reservado',
                totalAmount: totalAmount,
              }
            });
            
            for (const [material, items] of Object.entries(orderItemsByMaterial)) {
               const materialCode = material.substring(0, 3).toUpperCase();
               const group = await tx.orderMaterialGroup.create({
                 data: {
                    orderId: newOrder.id,
                    material,
                    groupNumber: `${orderNumber}-${materialCode}`,
                    status: 'Pendiente'
                 }
               });
               
               await tx.orderItem.createMany({
                 data: items.map(item => ({
                   ...item,
                   orderId: newOrder.id,
                   materialGroupId: group.id
                 }))
               });
            }
            
            return await tx.order.findUnique({
               where: { id: newOrder.id },
               include: { items: true, groups: { include: { items: true } } }
            });
          }, {
            maxWait: 5000, 
            timeout: 10000 
          });
          
          // If transaction succeeds, break out of loop
          break;
      } catch (e: any) {
         if (e.code === 'P2002') {
            const target = e.meta?.target;
            
            // Caso A: Carrera de cliente. Dos envíos paralelos insertaron el mismo clientRequestId
            if (target && target.includes('clientRequestId') && data.clientRequestId) {
                const racedOrder = await prisma.order.findUnique({
                   where: { clientRequestId: data.clientRequestId },
                   include: { items: true, groups: { include: { items: true } } }
                });
                if (racedOrder) {
                   verifyIdempotentContent(racedOrder);
                   order = racedOrder; // Asignamos para retornar como éxito
                   break; // Escapamos del bucle
                }
            }
            
            // Caso B: Colisión de orderNumber (Normal, generamos otro consecutivo)
            if (target && target.includes('orderNumber')) {
               attempt++;
               if (attempt >= MAX_RETRIES) throw new BusinessLogicError('No se pudo generar un número de pedido único tras varios intentos.');
               continue; // Repetir el bucle
            }
         }
         throw e; // Bubble up other errors
      }
    }
    
    return { success: true, order: order ? { ...order, number: order.orderNumber } : null };
  } catch (error: any) {
      console.error('Error creating order:', error);
      if (error instanceof BusinessLogicError) {
         return { success: false, error: error.message, code: error.code, conflicts: (error as any).conflicts };
      }
      return { 
        success: false, 
        error: error.message,
        code: 'NETWORK_OR_DB_ERROR'
      };
    }
}

export async function transitionOrder(orderId: string, action: OrderTransitionAction, reason?: string, trackingInfo?: {carrier: string, trackingNumber: string}) {
  const { user, role } = await requireRole(['admin', 'vendedor', 'cliente']);
  const actor = await getAuditActor();
  
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true }
      });
      
      if (!existingOrder) throw new BusinessLogicError('Pedido no encontrado');

      if (role === 'cliente') {
        if (existingOrder.customer.authUserId !== user.id) throw new BusinessLogicError('No autorizado');
        if (action !== 'CANCEL') throw new BusinessLogicError('El cliente solo puede cancelar');
        if (existingOrder.status !== 'Reservado') throw new BusinessLogicError('Solo puedes cancelar pedidos en estado Reservado');
      } else if (role === 'vendedor') {
        throw new BusinessLogicError('Vendedor no autorizado para cambiar estados');
      }
      
      const nextStatus = getNextState(existingOrder.status, action);

        

      if (action === 'CANCEL' && existingOrder.status !== 'Cancelado') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { decrement: item.quantity } }
          });
        }
      }
      
      if (action === 'DISPATCH' && existingOrder.status !== 'Despachado') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              physicalStock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          });
        }
      }

            await logAuditEvent(actor, {
        action: 'STATUS_CHANGE',
        entityType: 'ORDER',
        entityId: orderId,
        orderNumber: existingOrder.orderNumber,
        origin: role === 'admin' ? 'admin_dashboard' : 'cliente_dashboard',
        changes: { previousStatus: existingOrder.status, nextStatus, action, reason }
      }, tx);
      const updateData: any = { status: nextStatus };
      if (action === 'DISPATCH' && trackingInfo) {
        updateData.carrier = trackingInfo.carrier;
        updateData.trackingNumber = trackingInfo.trackingNumber;
      }

      return await tx.order.update({
        where: { id: orderId },
        data: updateData
      });
    }, { maxWait: 5000, timeout: 10000 });
    
    return { success: true, order: order ? { ...order, number: order.orderNumber } : null };
  } catch (error: any) {
    console.error('Error transitioning order:', error);
    return { success: false, error: error.message };
  }
}

export async function acknowledgeOrderAdjustment(orderId: string) {
  const { user, role } = await requireRole(['cliente']);
  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    if (!existingOrder) throw new BusinessLogicError('Pedido no encontrado');
    if (existingOrder.customer.authUserId !== user.id) throw new BusinessLogicError('No autorizado');
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { adjustmentAcknowledged: true }
    });
    return { success: true, order: order ? { ...order, number: order.orderNumber } : null };
  } catch (error: any) {
    console.error('Error acknowledging adjustment:', error);
    return { success: false, error: error.message };
  }
}
export async function updateOrderChecklist(orderId: string, items: { id: string, newQuantity: number, adjustmentReason?: string, verified?: boolean, issue?: string | null }[], adjustmentAcknowledged: boolean = false) {
  await requireRole(['admin']);
  
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      
      if (!existingOrder) throw new BusinessLogicError('Pedido no encontrado');
      
      for (const update of items) {
        const existingItem = existingOrder.items.find(i => i.id === update.id);
        if (!existingItem) continue;

        const needsQuantityUpdate = update.newQuantity !== existingItem.quantity;
        const needsVerificationUpdate = update.verified !== existingItem.verified || update.issue !== existingItem.issue;

        if (needsQuantityUpdate) {
          const diff = existingItem.quantity - update.newQuantity;

          await tx.product.update({
            where: { id: existingItem.productId },
            data: { reservedStock: { decrement: diff } }
          });
        }

        if (needsQuantityUpdate || needsVerificationUpdate) {
          await tx.orderItem.update({
            where: { id: update.id },
            data: {
              ...(needsQuantityUpdate ? {
                originalQuantity: existingItem.originalQuantity || existingItem.quantity,
                quantity: update.newQuantity,
                adjustmentReason: update.adjustmentReason || null
              } : {}),
              verified: update.verified ?? existingItem.verified,
              issue: update.issue ?? existingItem.issue
            }
          });
        }
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true }
      });

      if (!updatedOrder) throw new BusinessLogicError('Pedido no encontrado tras actualización');

      const discount = updatedOrder.customer?.showDiscount ? updatedOrder.customer.discount / 100 : 0;
      const newSubtotal = updatedOrder.items.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0);
      const newTotalAmount = newSubtotal * (1 - discount);

      return await tx.order.update({
        where: { id: orderId },
        data: { 
          totalAmount: newTotalAmount,
          adjustmentAcknowledged
        },
        include: { items: { include: { product: true } } }
      });
    });

    return { success: true, order: order ? { ...order, number: order.orderNumber } : null };
  } catch (error: any) {
    console.error('Error updating order checklist:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMaterialGroupInvoice(groupId: string, invoice: string) {
  try {
    await requireRole(['admin']);
    const group = await prisma.orderMaterialGroup.findUnique({
       where: { id: groupId },
       include: { order: { include: { groups: true } } }
    });
    if (!group) throw new BusinessLogicError("Grupo no encontrado");
    if (!invoice.trim()) throw new BusinessLogicError("El número de factura no puede estar vacío");

    // Verificar unicidad externa dentro del pedido
    const duplicate = group.order.groups.find(g => g.id !== groupId && g.externalInvoice === invoice.trim());
    if (duplicate) throw new BusinessLogicError("El número de factura externa ya está registrado en otro grupo de este pedido");

    await prisma.orderMaterialGroup.update({
       where: { id: groupId },
       data: { 
         externalInvoice: invoice.trim(),
         status: 'Preparado y Facturado',
         isVerified: true
       }
    });

    // Auto-avanzar el pedido principal si todos los grupos están facturados y el pedido sigue en preparación
    const updatedOrder = await prisma.order.findUnique({
      where: { id: group.orderId },
      include: { groups: true }
    });

    const allInvoiced = updatedOrder?.groups.every(g => g.externalInvoice);
    if (allInvoiced && updatedOrder?.status === 'En preparación') {
      await transitionOrder(group.orderId, 'SEND_TO_VERIFICATION', 'Autocompletado al facturar todos los materiales');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOrderById(id: string) {
  noStore();
  try {
    const { role, user } = await requireRole(['admin', 'vendedor', 'cliente']);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        items: { include: { product: true } }, 
        customer: true, 
        seller: true, 
        groups: { include: { items: true } },
        // statusHistory is fetched manually via AuditEvent
      }
    });

    if (!order) return { success: false, message: 'Pedido no encontrado' };

    // Security check
    if (role === 'vendedor') {
       const sellerProfile = await prisma.seller.findUnique({ where: { authUserId: user.id } });
       if (order.sellerId !== sellerProfile?.id) {
           return { success: false, message: 'Acceso denegado a este pedido' };
       }
    } else if (role === 'cliente') {
       const customerProfile = await prisma.customer.findUnique({ where: { authUserId: user.id } });
       if (order.customerId !== customerProfile?.id) {
           return { success: false, message: 'Acceso denegado a este pedido' };
       }
    }

    // Fetch timeline from AuditEvent
    const auditEvents = await prisma.auditEvent.findMany({
      where: { entityType: 'ORDER', entityId: id, action: 'STATUS_CHANGE' },
      orderBy: { createdAt: 'desc' }
    });
    
    const mappedStatusHistory = auditEvents.map(e => ({
       id: e.id,
       orderId: e.entityId,
       previousStatus: (e.changes as any)?.previousStatus,
       nextStatus: (e.changes as any)?.nextStatus,
       action: (e.changes as any)?.action,
       actorId: e.actorId,
       actorAuthUserId: e.actorId,
       actorRole: e.actorRole,
       actorName: e.actorName,
       reason: (e.changes as any)?.reason,
       createdAt: e.createdAt
    }));

    return { success: true, order: order ? { ...order, number: order.orderNumber, statusHistory: mappedStatusHistory } : null };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function checkOrderByRequestId(clientRequestId: string) {
  noStore();
  try {
    const { user, role } = await requireRole(['admin', 'vendedor']);
    let whereClause: any = { clientRequestId };
    
    if (role === 'vendedor') {
      const sellerProfile = await prisma.seller.findUnique({ where: { authUserId: user.id } });
      if (!sellerProfile) {
        return { success: false, error: 'Perfil de vendedor no encontrado' };
      }
      whereClause.sellerId = sellerProfile.id;
    }
    
    const order = await prisma.order.findFirst({
      where: whereClause,
      select: { orderNumber: true }
    });
    
    if (order) {
      return { success: true, order: { orderNumber: order.orderNumber } };
    }
    
    return { success: false, notFound: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
