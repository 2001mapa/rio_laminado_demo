// Pruebas Automatizadas de Autorización
const assert = require('assert');

// Mock dependencias
import Module from 'module';
const originalRequire = (Module as any).prototype.require;

(global as any).mockUserRole = 'vendedor';
(global as any).mockUserStatus = 'suspended';

(Module as any).prototype.require = function(path: string) {
  if (path === '@/utils/supabase/server') {
    return {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: 'test-user-id', app_metadata: { role: (global as any).mockUserRole } } }, error: null })
        }
      })
    };
  }
  if (path === '@/lib/prisma') {
    return {
      prisma: {
        seller: {
          findUnique: async () => {
            if ((global as any).mockUserRole === 'vendedor') return { status: (global as any).mockUserStatus };
            return null;
          }
        },
        customer: {
          findUnique: async () => {
            if ((global as any).mockUserRole === 'cliente') return { status: (global as any).mockUserStatus };
            return null;
          }
        }
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

const { requireRole, getSessionUser } = require('../src/utils/auth-helpers');

async function runAuthTests() {
  console.log("==================================================");
  console.log("🚀 EJECUTANDO TESTS AUTOMATIZADOS: AUTORIZACIÓN");
  console.log("==================================================");

  let hasErrors = false;
  const logAssert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log("  ✅ PASSED: " + msg);
    } else {
      console.error("  ❌ FAILED: " + msg);
      hasErrors = true;
    }
  };

  try {
    console.log("\\n[TEST] Vendedor suspendido es rechazado por requireRole");
    (global as any).mockUserRole = 'vendedor';
    (global as any).mockUserStatus = 'suspended';
    
    let threw = false;
    try {
      await requireRole(['vendedor']);
    } catch (e: any) {
      threw = true;
      logAssert(e.message.includes("cuenta ha sido suspendida"), "Excepción correcta: " + e.message);
    }
    logAssert(threw, "requireRole debe lanzar excepción si el vendedor está suspendido.");

    console.log("\\n[TEST] Vendedor activo es aceptado por requireRole");
    (global as any).mockUserRole = 'vendedor';
    (global as any).mockUserStatus = 'active';
    
    threw = false;
    try {
      const { role } = await requireRole(['vendedor']);
      logAssert(role === 'vendedor', "Rol retornado correctamente.");
    } catch (e: any) {
      threw = true;
    }
    logAssert(!threw, "requireRole NO debe lanzar excepción si el vendedor está activo.");

    console.log("\\n[TEST] getSessionUser resuelve estado dinámico");
    (global as any).mockUserRole = 'vendedor';
    (global as any).mockUserStatus = 'suspended';
    const session = await getSessionUser();
    logAssert(session.status === 'suspended', "getSessionUser detectó estado suspendido desde la BD.");

  } catch (error) {
    console.error("Test framework error:", error);
    hasErrors = true;
  }

  console.log("\\n==================================================");
  if (hasErrors) {
    console.error("❌ ALGUNAS PRUEBAS FALLARON");
    process.exit(1);
  } else {
    console.log("✅ TODAS LAS PRUEBAS PASARON");
    process.exit(0);
  }
}

runAuthTests();
