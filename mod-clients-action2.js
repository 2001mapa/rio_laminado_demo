const fs = require('fs');

let code = fs.readFileSync('src/app/actions/clients.ts', 'utf8');

const newAction = `
export async function resetCustomerPasswordAction(customerId: string, newPassword: string) {
  await requireRole(['admin']);
  if (newPassword.length < 6) {
    return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.authUserId) {
      return { success: false, message: 'Cliente no encontrado o sin cuenta de acceso activa.' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseKey) {
      return { success: false, message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' };
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(customer.authUserId, {
      password: newPassword,
    });

    if (error) throw error;

    return { success: true, message: 'Contraseña restablecida correctamente.' };
  } catch (error: any) {
    console.error('Error resetting customer password:', error);
    return { success: false, message: \`Error interno: \${error.message}\` };
  }
}
`;

if (!code.includes('resetCustomerPasswordAction')) {
  code = code + '\n' + newAction;
  fs.writeFileSync('src/app/actions/clients.ts', code);
  console.log('resetCustomerPasswordAction added');
}
