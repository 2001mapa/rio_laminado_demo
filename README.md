# RIO B2B Demo

Primera muestra funcional de interfaz para RIO, bodega de oro laminado.
Esta es una demo navegable con **datos mock**, construida para ilustrar el flujo de pedidos entre el cliente mayorista y la bodega.

## Tecnologías Utilizadas
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Lucide React (Iconos)

## Cómo iniciar la demo

1. Asegúrate de tener Node.js instalado.
2. Abre la terminal en esta carpeta (`rio-b2b-demo`).
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

## Rutas Principales
La aplicación comienza en la ruta de acceso unificada:
- `/acceso-rio`: Pantalla de entrada con botones para ver como Cliente o Admin.

### Portal de Cliente (Mobile First)
- `/cliente`: Catálogo de productos.
- `/cliente/buscar`: Buscador de referencias y productos.
- `/cliente/carrito`: Carrito de compras y resumen.
- `/cliente/pedido/[id]`: Detalle del pedido reservado o histórico.
- `/cliente/perfil`: Datos del usuario, historial de pedidos y botón para salir de la demo.

### Panel Administrativo (Desktop First)
- `/admin`: Dashboard con métricas.
- `/admin/pedidos`: Bandeja principal de pedidos.
- `/admin/pedidos/[id]`: Detalle del pedido y gestión de estados.
- `/admin/pedidos/[id]/imprimir`: Hoja imprimible para preparación manual.
- `/admin/pedidos/[id]/verificar`: Checklist digital para el bodeguero (Verificador).
- `/admin/inventario`: Vista de inventario (solo visual).
- `/admin/clientes`: Vista de clientes con opción de "Ver como" para la demo.

## Funcionalidades Simuladas
- **Base de datos:** Todos los datos (productos, clientes, pedidos, carrito) viven en un Contexto de React y se persisten localmente en `localStorage`. 
- **Flujos de estado:** Puedes mover un pedido libremente desde Reservado hasta Despachado, pero la demo bloquea el paso a "Verificado" si no se completa el Checklist Digital.
- **Checklist Digital:** Puedes confirmar cada referencia de un pedido y reportar incidencias simuladas ("Faltan unidades", etc.).
- **Catálogo:** Puedes agregar al carrito hasta simular un límite máximo de inventario, tras el cual se muestra un aviso.
- **Restablecer datos:** Desde el Perfil del cliente puedes restablecer los datos para que regresen al estado inicial.

## Notas Adicionales
- No hay autenticación real.
- No hay integración con WhatsApp, correos, ni base de datos real (Supabase).
- No se han conectado lectores de códigos de barras.
