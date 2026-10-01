"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.transitionOrder = transitionOrder;
exports.acknowledgeOrderAdjustment = acknowledgeOrderAdjustment;
exports.updateOrderChecklist = updateOrderChecklist;
exports.updateMaterialGroupInvoice = updateMaterialGroupInvoice;
exports.getOrderById = getOrderById;
const cache_1 = require("next/cache");
const order_status_1 = require("@/lib/order-status");
const prisma_1 = require("@/lib/prisma");
const auth_helpers_1 = require("@/utils/auth-helpers");
const audit_1 = require("@/lib/audit");
async function createOrder(data) {
    var _a;
    const { user, role } = await (0, auth_helpers_1.requireRole)(['cliente', 'vendedor', 'admin']);
    try {
        let finalCustomerId;
        let finalSellerId = null;
        let discount = 0;
        // 1. Resolver identidades de forma segura
        if (role === 'cliente') {
            const customer = await prisma_1.prisma.customer.findUnique({ where: { authUserId: user.id } });
            if (!customer)
                throw new Error('Perfil de cliente no encontrado');
            finalCustomerId = customer.id;
            // Para pedidos directos de cliente, sellerId siempre es null
        }
        else {
            if (!data.customerId)
                throw new Error('Se requiere el ID del cliente para crear el pedido');
            finalCustomerId = data.customerId;
            if (role === 'vendedor') {
                const seller = await prisma_1.prisma.seller.findUnique({ where: { authUserId: user.id } });
                if (!seller)
                    throw new Error('Perfil de vendedor no encontrado');
                if (seller.status !== 'active')
                    throw new Error('Cuenta de vendedor suspendida');
                finalSellerId = seller.id;
            }
        }
        if (!data.items || data.items.length === 0) {
            throw new Error('El pedido debe tener al menos un articulo.');
        }
        // Helper for Idempotency Content Verification
        const verifyIdempotentContent = (existingOrder) => {
            // Si existe pero es de otro usuario, rechazar SIN REVELAR INFO (parecerá un error genérico o colisión de UUID)
            if (existingOrder.customerId !== finalCustomerId || existingOrder.sellerId !== finalSellerId) {
                throw new Error('Identificador de solicitud inváido o colisión de petición.');
            }
            // Validar que el contenido sea el mismo (para evitar que reusen un ID para un carrito distinto)
            if (existingOrder.items.length !== data.items.length) {
                throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distinto contenido.');
            }
            // Chequeo de productos y cantidades (ignora el orden)
            for (const sentItem of data.items) {
                const match = existingOrder.items.find((ei) => ei.productId === sentItem.productId && ei.quantity === sentItem.quantity);
                if (!match) {
                    throw new Error('El identificador de solicitud ya fue utilizado para un pedido con distinto contenido.');
                }
            }
            return true;
        };
        // 2. Verificación de Idempotencia PRE-creación
        if (data.clientRequestId) {
            const existingOrder = await prisma_1.prisma.order.findUnique({
                where: { clientRequestId: data.clientRequestId },
                include: { items: true, groups: { include: { items: true } } }
            });
            if (existingOrder) {
                verifyIdempotentContent(existingOrder);
                return { success: true, order: Object.assign(Object.assign({}, existingOrder), { number: existingOrder.orderNumber }) };
            }
        }
        // Obtener detalles del cliente para aplicar descuentos reales
        const targetCustomer = await prisma_1.prisma.customer.findUnique({ where: { id: finalCustomerId } });
        if (!targetCustomer)
            throw new Error('Cliente objetivo no encontrado');
        if (targetCustomer.showDiscount) {
            discount = targetCustomer.discount / 100;
        }
        // Retry loop for unique constraint violations
        const MAX_RETRIES = 3;
        let attempt = 0;
        let order;
        while (attempt < MAX_RETRIES) {
            try {
                order = await prisma_1.prisma.$transaction(async (tx) => {
                    let subtotal = 0;
                    const orderItemsByMaterial = {};
                    for (const item of data.items) {
                        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                            throw new Error('Cantidad inváida.');
                        }
                        const product = await tx.product.findUnique({
                            where: { id: item.productId }
                        });
                        if (!product || !product.isActive) {
                            throw new Error(`Producto no encontrado o inactivo.`);
                        }
                        if (!product.material || product.material === 'Por revisar') {
                            throw new Error(`El producto ${product.name} no tiene un material definido (Por revisar). No se puede vender.`);
                        }
                        // Sizes validation
                        if (product.category === 'Anillos') {
                            if (!item.sizeDetails || item.sizeDetails.length === 0) {
                                throw new Error(`El anillo ${product.name} requiere al menos una talla.`);
                            }
                            const sum = item.sizeDetails.reduce((a, b) => a + b.quantity, 0);
                            if (sum !== item.quantity) {
                                throw new Error(`La suma de las tallas (${sum}) no coincide con la cantidad total (${item.quantity}) para el anillo ${product.name}.`);
                            }
                        }
                        else if (item.sizeDetails && item.sizeDetails.length > 0 && product.category !== 'Anillos') {
                            throw new Error(`El producto ${product.name} no es un anillo, no puede llevar desglose de tallas.`);
                        }
                        const available = product.physicalStock - product.reservedStock;
                        if (item.quantity > available) {
                            throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${available}.`);
                        }
                        const updatedProduct = await tx.product.update({
                            where: { id: product.id },
                            data: {
                                reservedStock: { increment: item.quantity }
                            }
                        });
                        if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
                            throw new Error(`Conflicto de concurrencia: Stock agotado para ${product.name}.`);
                        }
                        const price = product.price;
                        subtotal += price * item.quantity;
                        const mat = product.material;
                        if (!orderItemsByMaterial[mat])
                            orderItemsByMaterial[mat] = [];
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
                            if (!isNaN(num))
                                nextNumber = num + 1;
                        }
                    }
                    const orderNumber = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
                    const newOrder = await tx.order.create({
                        data: {
                            orderNumber,
                            clientRequestId: data.clientRequestId || undefined,
                            customerId: finalCustomerId,
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
                            data: items.map(item => (Object.assign(Object.assign({}, item), { orderId: newOrder.id, materialGroupId: group.id })))
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
            }
            catch (e) {
                if (e.code === 'P2002') {
                    const target = (_a = e.meta) === null || _a === void 0 ? void 0 : _a.target;
                    // Caso A: Carrera de cliente. Dos envíos paralelos insertaron el mismo clientRequestId
                    if (target && target.includes('clientRequestId') && data.clientRequestId) {
                        const racedOrder = await prisma_1.prisma.order.findUnique({
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
                        if (attempt >= MAX_RETRIES)
                            throw new Error('No se pudo generar un número de pedido único tras varios intentos.');
                        continue; // Repetir el bucle
                    }
                }
                throw e; // Bubble up other errors
            }
        }
        return { success: true, order: order ? Object.assign(Object.assign({}, order), { number: order.orderNumber }) : null };
    }
    catch (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
    }
}
async function transitionOrder(orderId, action, reason, trackingInfo) {
    const { user, role } = await (0, auth_helpers_1.requireRole)(['admin', 'vendedor', 'cliente']);
    const actor = await (0, audit_1.getAuditActor)();
    try {
        const order = await prisma_1.prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true, customer: true }
            });
            if (!existingOrder)
                throw new Error('Pedido no encontrado');
            if (role === 'cliente') {
                if (existingOrder.customer.authUserId !== user.id)
                    throw new Error('No autorizado');
                if (action !== 'CANCEL')
                    throw new Error('El cliente solo puede cancelar');
                if (existingOrder.status !== 'Reservado')
                    throw new Error('Solo puedes cancelar pedidos en estado Reservado');
            }
            else if (role === 'vendedor') {
                throw new Error('Vendedor no autorizado para cambiar estados');
            }
            const nextStatus = (0, order_status_1.getNextState)(existingOrder.status, action);
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
            await (0, audit_1.logAuditEvent)(actor, {
                action: 'STATUS_CHANGE',
                entityType: 'ORDER',
                entityId: orderId,
                orderNumber: existingOrder.orderNumber,
                origin: role === 'admin' ? 'admin_dashboard' : 'cliente_dashboard',
                changes: { previousStatus: existingOrder.status, nextStatus, action, reason }
            }, tx);
            const updateData = { status: nextStatus };
            if (action === 'DISPATCH' && trackingInfo) {
                updateData.carrier = trackingInfo.carrier;
                updateData.trackingNumber = trackingInfo.trackingNumber;
            }
            return await tx.order.update({
                where: { id: orderId },
                data: updateData
            });
        }, { maxWait: 5000, timeout: 10000 });
        return { success: true, order: order ? Object.assign(Object.assign({}, order), { number: order.orderNumber }) : null };
    }
    catch (error) {
        console.error('Error transitioning order:', error);
        return { success: false, error: error.message };
    }
}
async function acknowledgeOrderAdjustment(orderId) {
    const { user, role } = await (0, auth_helpers_1.requireRole)(['cliente']);
    try {
        const existingOrder = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        });
        if (!existingOrder)
            throw new Error('Pedido no encontrado');
        if (existingOrder.customer.authUserId !== user.id)
            throw new Error('No autorizado');
        const order = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: { adjustmentAcknowledged: true }
        });
        return { success: true, order: order ? Object.assign(Object.assign({}, order), { number: order.orderNumber }) : null };
    }
    catch (error) {
        console.error('Error acknowledging adjustment:', error);
        return { success: false, error: error.message };
    }
}
async function updateOrderChecklist(orderId, items, adjustmentAcknowledged = false) {
    await (0, auth_helpers_1.requireRole)(['admin']);
    try {
        const order = await prisma_1.prisma.$transaction(async (tx) => {
            var _a, _b, _c;
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });
            if (!existingOrder)
                throw new Error('Pedido no encontrado');
            for (const update of items) {
                const existingItem = existingOrder.items.find(i => i.id === update.id);
                if (!existingItem)
                    continue;
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
                        data: Object.assign(Object.assign({}, (needsQuantityUpdate ? {
                            originalQuantity: existingItem.originalQuantity || existingItem.quantity,
                            quantity: update.newQuantity,
                            adjustmentReason: update.adjustmentReason || null
                        } : {})), { verified: (_a = update.verified) !== null && _a !== void 0 ? _a : existingItem.verified, issue: (_b = update.issue) !== null && _b !== void 0 ? _b : existingItem.issue })
                    });
                }
            }
            const updatedOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true, customer: true }
            });
            if (!updatedOrder)
                throw new Error('Pedido no encontrado tras actualización');
            const discount = ((_c = updatedOrder.customer) === null || _c === void 0 ? void 0 : _c.showDiscount) ? updatedOrder.customer.discount / 100 : 0;
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
        return { success: true, order: order ? Object.assign(Object.assign({}, order), { number: order.orderNumber }) : null };
    }
    catch (error) {
        console.error('Error updating order checklist:', error);
        return { success: false, error: error.message };
    }
}
async function updateMaterialGroupInvoice(groupId, invoice) {
    try {
        await (0, auth_helpers_1.requireRole)(['admin']);
        const group = await prisma_1.prisma.orderMaterialGroup.findUnique({
            where: { id: groupId },
            include: { order: { include: { groups: true } } }
        });
        if (!group)
            throw new Error("Grupo no encontrado");
        if (!invoice.trim())
            throw new Error("El número de factura no puede estar vacío");
        // Verificar unicidad externa dentro del pedido
        const duplicate = group.order.groups.find(g => g.id !== groupId && g.externalInvoice === invoice.trim());
        if (duplicate)
            throw new Error("El número de factura externa ya está registrado en otro grupo de este pedido");
        await prisma_1.prisma.orderMaterialGroup.update({
            where: { id: groupId },
            data: {
                externalInvoice: invoice.trim(),
                status: 'Preparado y Facturado',
                isVerified: true
            }
        });
        // Auto-avanzar el pedido principal si todos los grupos están facturados y el pedido sigue en preparación
        const updatedOrder = await prisma_1.prisma.order.findUnique({
            where: { id: group.orderId },
            include: { groups: true }
        });
        const allInvoiced = updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.groups.every(g => g.externalInvoice);
        if (allInvoiced && (updatedOrder === null || updatedOrder === void 0 ? void 0 : updatedOrder.status) === 'En preparación') {
            await transitionOrder(group.orderId, 'SEND_TO_VERIFICATION', 'Autocompletado al facturar todos los materiales');
        }
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
async function getOrderById(id) {
    (0, cache_1.unstable_noStore)();
    try {
        const { role, user } = await (0, auth_helpers_1.requireRole)(['admin', 'vendedor', 'cliente']);
        const order = await prisma_1.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                customer: true,
                seller: true,
                groups: { include: { items: true } },
                // statusHistory is fetched manually via AuditEvent
            }
        });
        if (!order)
            return { success: false, message: 'Pedido no encontrado' };
        // Security check
        if (role === 'vendedor') {
            const sellerProfile = await prisma_1.prisma.seller.findUnique({ where: { authUserId: user.id } });
            if (order.sellerId !== (sellerProfile === null || sellerProfile === void 0 ? void 0 : sellerProfile.id)) {
                return { success: false, message: 'Acceso denegado a este pedido' };
            }
        }
        else if (role === 'cliente') {
            const customerProfile = await prisma_1.prisma.customer.findUnique({ where: { authUserId: user.id } });
            if (order.customerId !== (customerProfile === null || customerProfile === void 0 ? void 0 : customerProfile.id)) {
                return { success: false, message: 'Acceso denegado a este pedido' };
            }
        }
        // Fetch timeline from AuditEvent
        const auditEvents = await prisma_1.prisma.auditEvent.findMany({
            where: { entityType: 'ORDER', entityId: id, action: 'STATUS_CHANGE' },
            orderBy: { createdAt: 'desc' }
        });
        const mappedStatusHistory = auditEvents.map(e => {
            var _a, _b, _c, _d;
            return ({
                id: e.id,
                orderId: e.entityId,
                previousStatus: (_a = e.changes) === null || _a === void 0 ? void 0 : _a.previousStatus,
                nextStatus: (_b = e.changes) === null || _b === void 0 ? void 0 : _b.nextStatus,
                action: (_c = e.changes) === null || _c === void 0 ? void 0 : _c.action,
                actorId: e.actorId,
                actorAuthUserId: e.actorId,
                actorRole: e.actorRole,
                actorName: e.actorName,
                reason: (_d = e.changes) === null || _d === void 0 ? void 0 : _d.reason,
                createdAt: e.createdAt
            });
        });
        return { success: true, order: order ? Object.assign(Object.assign({}, order), { number: order.orderNumber, statusHistory: mappedStatusHistory }) : null };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
}
