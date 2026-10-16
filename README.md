# RIO Oro Laminado

Aplicación B2B de RIO para catálogo, inventario, pedidos y ventas. Tiene tres áreas autenticadas: cliente, vendedor y administración. La versión de producción se publica en [rioorolaminado.com](https://rioorolaminado.com/).

## Tecnología

- Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS.
- Supabase Auth para sesiones y Supabase Storage para imágenes.
- PostgreSQL mediante Prisma para los datos de negocio.
- PWA con soporte de trabajo sin conexión para el flujo de ventas del vendedor.

Los datos de negocio no son datos simulados. El navegador puede conservar copias o una cola local para funciones offline; la base de datos sigue siendo la fuente principal.

## Desarrollo local

1. Instala las dependencias con `npm install`.
2. Configura un archivo `.env.local` con las variables necesarias para tu entorno. No lo subas a Git.
3. Ejecuta `npm run dev` y abre <http://localhost:3000>.

Variables principales (solo nombres; nunca incluyas sus valores en documentación o capturas):

| Variable | Uso |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Conexiones PostgreSQL de Prisma. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público de Supabase y autenticación. |
| `SUPABASE_SERVICE_ROLE_KEY` | Administración de usuarios; **solo servidor**. |
| `PRIMARY_ADMIN_USER_ID` | Protección de la cuenta administrativa principal. |
| `DISCORD_ERROR_WEBHOOK_URL`, `DISCORD_SECURITY_WEBHOOK_URL` | Alertas opcionales; **solo servidor**. |

`npm run build` verifica la compilación de producción. `npm test` ejecuta la suite principal; para las pruebas de Vitest usa `npx vitest run`.

## Áreas principales

- `/login`: acceso unificado; `/` redirige aquí.
- `/cliente`: catálogo, carrito, perfil y detalle de pedidos.
- `/vendedor/nueva-venta`: venta asistida por lector QR, con flujo offline; el vendedor también tiene perfil y detalle de pedidos.
- `/admin`: panel administrativo, pedidos, inventario, clientes, vendedores, administradores e historial.
- `/admin/mantenimiento`: interruptor exclusivo de administradores para pausar el acceso de clientes sin afectar a vendedores ni administradores.
- `/mantenimiento`: aviso que ven los clientes mientras el modo está activo.
- `/admin/inventario/imprimir` y `/admin/pedidos/[id]/imprimir`: impresión de etiquetas.

Las rutas privadas requieren sesión y permisos del rol correspondiente. El código de la aplicación está en `src/`, el esquema y las migraciones en `prisma/`, y las pruebas en `__tests__/`.

## Despliegue y alertas

El proyecto se despliega en Vercel desde `main`. Configura las variables de producción en Vercel; los cambios de variables se aplican a un despliegue nuevo. Consulta [la guía de alertas](docs/discord-monitoring.md) para el alcance y las limitaciones del monitoreo en Discord. Los webhooks son secretos y no deben compartirse ni almacenarse en el repositorio.

Los PDF solicitados para asuntos comerciales o administrativos se generan **fuera de este repositorio**; no forman parte de la aplicación ni del despliegue.

El mantenimiento para clientes se activa y desactiva manualmente desde el panel admin; no se enciende automáticamente en cada despliegue. El estado queda en la auditoría de la base de datos.
