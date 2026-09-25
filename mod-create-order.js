const fs = require('fs');
let code = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const regex = /export async function createOrder\(data: \{[\s\S]*?catch \(error: any\) \{/m;

const replacement = `export async function createOrder(data: {
  customerId?: string; // Solo requerido/confiado si es vendedor o admin
  items: { productId: string; quantity: number; sizeDetails?: { size: string, quantity: number }[] }[];
}) {
  const { user, role } = await requireRole(['cliente', 'vendedor', 'admin']);
  
  try {
    let finalCustomerId: string;
    let finalSellerId: string | null = null;
    let discount = 0;

    // 1. Resolver identidades de forma segura
    if (role === 'cliente') {
      const customer = await prisma.customer.findUnique({ where: { authUserId: user.id } });
      if (!customer) throw new Error('Perfil de cliente no encontrado');
      finalCustomerId = customer.id;
      // Para pedidos directos de cliente, sellerId siempre es null
    } else {
      if (!data.customerId) throw new Error('Se requiere el ID del cliente para crear el pedido');
      finalCustomerId = data.customerId;
      
      if (role === 'vendedor') {
        const seller = await prisma.seller.findUnique({ where: { authUserId: user.id } });
        if (!seller) throw new Error('Perfil de vendedor no encontrado');
        if (seller.status !== 'active') throw new Error('Cuenta de vendedor suspendida');
        finalSellerId = seller.id;
      }
    }

    // Obtener detalles del cliente para aplicar descuentos reales
    const targetCustomer = await prisma.customer.findUnique({ where: { id: finalCustomerId } });
    if (!targetCustomer) throw new Error('Cliente objetivo no encontrado');
    if (targetCustomer.showDiscount) {
      discount = targetCustomer.discount / 100;
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('El pedido debe tener al menos un artculo.');
    }

    // Transaccin atmica
    const order = await prisma.$transaction(async (tx) => {
        let subtotal = 0;
        const orderItemsByMaterial: Record<string, any[]> = {};

        for (const item of data.items) {
          if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error('Cantidad invǭlida.');
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          
          if (!product || !product.isActive) {
            throw new Error(\`Producto no encontrado o inactivo.\`);
          }
          
          if (!product.material || product.material === 'Por revisar') {
            throw new Error(\`El producto \${product.name} no tiene un material definido (Por revisar). No se puede vender.\`);
          }

          // Sizes validation
          if (product.category === 'Anillos' && item.sizeDetails) {
             const sum = item.sizeDetails.reduce((a, b) => a + b.quantity, 0);
             if (sum !== item.quantity) {
                throw new Error(\`La suma de las tallas (\${sum}) no coincide con la cantidad total (\${item.quantity}) para el anillo \${product.name}.\`);
             }
          } else if (item.sizeDetails && product.category !== 'Anillos') {
             throw new Error(\`El producto \${product.name} no es un anillo, no puede llevar desglose de tallas.\`);
          }
          
          const available = product.physicalStock - product.reservedStock;
          if (item.quantity > available) {
            throw new Error(\`Stock insuficiente para \${product.name}. Solo quedan \${available}.\`);
          }
          
          const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: {
              reservedStock: { increment: item.quantity }
            }
          });

          if (updatedProduct.reservedStock > updatedProduct.physicalStock) {
            throw new Error(\`Conflicto de concurrencia: Stock agotado para \${product.name}.\`);
          }

          const price = product.price;
          subtotal += price * item.quantity;
          
          const mat = product.material;
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
        const orderNumber = \`PED-\${Math.floor(1000 + Math.random() * 9000)}-\${Date.now().toString().slice(-4)}\`;

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
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
                groupNumber: \`\${orderNumber}-\${materialCode}\`,
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
    
    return { success: true, order };
  } catch (error: any) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/actions/orders.ts', code);
