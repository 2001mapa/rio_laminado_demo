const fs = require('fs');
let code = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');

const targetFunction = `export async function createSeller(data: {
  name: string;
  email: string;
}) {
  await requireRole(['admin']);
  
  const normalizedEmail = data.email.trim().toLowerCase();

  try {
    const existing = await prisma.seller.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existing) {
      return { success: false, message: 'Ya existe un vendedor con este correo electrnico.' };
    }

    const adminAuthClient = getAdminClient();
    
    // Check if auth user already exists by email
    const { data: usersData, error: usersError } = await adminAuthClient.auth.admin.listUsers();
    let authUser = usersData?.users.find(u => u.email === normalizedEmail);

    const tempPassword = 'V-' + crypto.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';

    if (!authUser) {
      // Create user
      const { data: createdUser, error: createError } = await adminAuthClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: data.name, role: 'vendedor' },
        app_metadata: { role: 'vendedor' }
      });
      if (createError) throw new Error(\`Error en Auth: \${createError.message}\`);
      authUser = createdUser.user;
    } else {
      // Update existing user role
      await adminAuthClient.auth.admin.updateUserById(authUser.id, {
        app_metadata: { role: 'vendedor' },
        user_metadata: { name: data.name, role: 'vendedor' }
      });
    }

    // Now create in Prisma
    try {
      const seller = await prisma.seller.create({
        data: {
          name: data.name,
          email: normalizedEmail,
          authUserId: authUser!.id,
          status: 'active'
        }
      });
      return { 
        success: true, 
        seller,
        tempPassword
      };
    } catch (dbError: any) {
      // Rollback Auth if Prisma fails
      await adminAuthClient.auth.admin.deleteUser(authUser!.id);
      throw new Error(\`Error en DB: \${dbError.message}\`);
    }

  } catch (error: any) {
    console.error('Error creating seller:', error);
    return { success: false, message: \`Error interno al crear el vendedor: \${error.message}\` };
  }
}`;

const replaceFunction = `export async function createSeller(data: {
  name: string;
  email: string;
}) {
  await requireRole(['admin']);
  
  const normalizedEmail = data.email.trim().toLowerCase();

  try {
    const existing = await prisma.seller.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existing) {
      return { success: false, message: 'Ya existe un perfil de vendedor con este correo electrónico.' };
    }

    const adminAuthClient = getAdminClient();
    
    const tempPassword = 'V-' + crypto.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';
    let authUser = null;
    let newlyCreated = false;

    // We do NOT use listUsers() to search across potentially 10k users.
    // Instead we try to create the user directly.
    const { data: createdUser, error: createError } = await adminAuthClient.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: data.name, role: 'vendedor' },
      app_metadata: { role: 'vendedor' }
    });

    if (createError) {
      // Supabase typically throws 422 "Email address already registered by another user"
      return { success: false, message: \`La cuenta ya existe en autenticación o hubo un error: \${createError.message}\` };
    }
    
    authUser = createdUser.user;
    newlyCreated = true;

    // Now create in Prisma
    try {
      const seller = await prisma.seller.create({
        data: {
          name: data.name,
          email: normalizedEmail,
          authUserId: authUser!.id,
          status: 'active'
        }
      });
      return { 
        success: true, 
        seller,
        tempPassword
      };
    } catch (dbError: any) {
      // ONLY rollback if we created the user
      if (newlyCreated && authUser) {
        await adminAuthClient.auth.admin.deleteUser(authUser.id);
      }
      return { success: false, message: \`Error en base de datos: \${dbError.message}\` };
    }

  } catch (error: any) {
    console.error('Error creating seller:', error);
    return { success: false, message: \`Error interno al crear el vendedor: \${error.message}\` };
  }
}`;

// Note: due to unicode characters 'electrnico' in existing code, simple replace might fail. 
// I will split and join on generic keywords.
const sigStart = "export async function createSeller(data: {";
const sigEnd = "export async function updateSeller(";

const startIndex = code.indexOf(sigStart);
const endIndex = code.indexOf(sigEnd);

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + replaceFunction + "\n\n" + code.substring(endIndex);
    fs.writeFileSync('src/app/actions/sellers.ts', code);
    console.log('Fixed createSeller');
} else {
    console.log('Could not find createSeller bounds');
}
