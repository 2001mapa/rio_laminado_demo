const fs = require('fs');

let code = fs.readFileSync('src/app/admin/clientes/[id]/page.tsx', 'utf8');

if (!code.includes('updateCustomerStatusAction')) {
  code = code.replace(
    'import { ArrowLeft, Edit2',
    "import { updateCustomerStatusAction } from '@/app/actions/clients';\nimport { addToast } from '@/lib/toast';\nimport { ArrowLeft, Edit2"
  );
}

const handlerCode = `
  const handleToggleStatus = async () => {
    try {
      const newStatus = customer.status === 'active' ? 'suspended' : 'active';
      const res = await updateCustomerStatusAction(customer.id, { status: newStatus });
      if (res.success) {
        addToast(res.message);
        refreshData();
      } else {
        addToast(res.message);
      }
    } catch (e) {
      addToast('Error al cambiar estado');
    }
  };
`;

code = code.replace('const customerOrders =', handlerCode + '\n  const customerOrders =');

// 1. Reemplazar Editar Descuento
code = code.replace(
  /onClick=\{\(\) => alert\('Acci.n simulada: Editar descuento'\)\}/g,
  "onClick={() => addToast('La edición de descuentos requiere un modal de confirmación. Pendiente de implementación.')}"
);

// 2. Reemplazar Activar/Suspender
code = code.replace(
  /onClick=\{\(\) => alert\('Acci.n simulada: Activar\/Suspender'\)\}/g,
  'onClick={handleToggleStatus}'
);

// 3. Reemplazar Reenviar invitación
code = code.replace(
  /onClick=\{\(\) => alert\('Acci.n simulada: Reenviar invitaci.n'\)\}/g,
  "onClick={() => addToast('La infraestructura de envío de correos no está configurada.')}"
);

// 4. Reemplazar Restablecer credenciales
code = code.replace(
  /onClick=\{\(\) => alert\('Acci.n simulada: Restablecer credenciales'\)\}/g,
  "onClick={() => addToast('El restablecimiento de credenciales requiere configuración de Supabase Auth.')}"
);

// 5. Reemplazar Verificar Documentación
code = code.replace(
  /onClick=\{\(\) => alert\('Acci.n simulada: Notificar requerimiento'\)\}/g,
  "onClick={() => addToast('La infraestructura de notificaciones no está configurada.')}"
);

// 6. Reemplazar Editar datos
code = code.replace(
  /onClick=\{\(\) => alert\('Acci.n simulada: Editar datos'\)\}/g,
  "onClick={() => addToast('La interfaz de edición de datos está en construcción.')}"
);

// 7. Remover mocks de Bogota, Fecha, Acceso
code = code.replace('Bogotǭ (Mock)', 'No registrada'); // Also fix 'Bogotǭ' if it's there
code = code.replace('Bogotá (Mock)', 'No registrada');

code = code.replace('01/01/2026 (Mock)', "{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('es-CO') : 'No registrada'}");

code = code.replace('Hace 2 horas (Mock)', 'Desconocido');

fs.writeFileSync('src/app/admin/clientes/[id]/page.tsx', code);
console.log('Client detail page updated');
