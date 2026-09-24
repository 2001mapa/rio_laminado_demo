const fs = require('fs');

let code = fs.readFileSync('src/app/actions/clients.ts', 'utf8');

const newAction = `
export async function updateCustomerDataAction(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  await requireRole(['admin']);
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null })
      }
    });
    return { success: true, message: 'Datos actualizados exitosamente.', customer };
  } catch (error: any) {
    console.error('Error updating customer data:', error);
    return { success: false, message: \`Error interno al actualizar datos: \${error.message}\` };
  }
}
`;

if (!code.includes('updateCustomerDataAction')) {
  code = code + '\n' + newAction;
  fs.writeFileSync('src/app/actions/clients.ts', code);
  console.log('Action added');
}
