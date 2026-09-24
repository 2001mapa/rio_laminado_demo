const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const newCode = `
export async function updateMaterialGroupInvoice(groupId: string, invoice: string) {
  try {
    await requireRole(['admin']);
    const group = await prisma.orderMaterialGroup.findUnique({
       where: { id: groupId },
       include: { order: { include: { groups: true } } }
    });
    if (!group) throw new Error("Grupo no encontrado");
    if (!invoice.trim()) throw new Error("El número de factura no puede estar vacío");

    // Verificar unicidad externa dentro del pedido
    const duplicate = group.order.groups.find(g => g.id !== groupId && g.externalInvoice === invoice.trim());
    if (duplicate) throw new Error("El número de factura externa ya está registrado en otro grupo de este pedido");

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
      await transitionOrder(group.orderId, 'VERIFY', 'Autocompletado al facturar todos los materiales');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
`;

fs.writeFileSync('src/app/actions/orders.ts', code + newCode);
console.log('orders.ts modified');
