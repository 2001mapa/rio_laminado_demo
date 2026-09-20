# Plan de implementación: catálogo B2B privado e inventario por CSV

## Objetivo

Convertir la aplicación actual en un catálogo B2B privado y seguro para una bodega de bisutería fina. El sistema externo de bodega no tiene API, por lo que el archivo CSV será el mecanismo controlado para actualizar el inventario físico.

El trabajo debe preservar la experiencia actual de cliente, vendedor y administrador, pero eliminar las dependencias de comportamiento de demo que puedan producir inconsistencias con la base de datos.

## Principios de negocio obligatorios

1. El CSV es la fuente de verdad del **stock físico**.
2. Una reserva no descuenta el stock físico: incrementa el **stock reservado**.
3. La disponibilidad publicada es: `stockDisponible = stockFisico - stockReservado`.
4. No se puede crear, modificar o confirmar una reserva si deja la disponibilidad en negativo.
5. Las operaciones de stock, pedidos y cambios de estado deben ser atómicas y ejecutarse en la base de datos.
6. Cada rol solo puede leer y modificar la información que necesita.
7. Toda importación de inventario debe poder auditarse y explicarse posteriormente.

## Estado actual a corregir

- Las Server Actions no validan sesión ni rol.
- `getAppData()` entrega todos los productos, clientes, vendedores y pedidos a cualquier portal.
- Los pedidos se crean sin reservar ni descontar disponibilidad en la base de datos.
- El carrito permite cantidades con límites simulados y no con stock real.
- El middleware no protege rutas en servidor; los layouts hacen validación solamente en el navegador.
- El importador recibe valores sin contrato de tipos ni validación detallada por fila.
- Una importación CSV actualiza SKU incluidos, pero no detecta SKU ausentes.
- Los precios usan `Float`; para COP se deben almacenar como entero en pesos o `Decimal`.
- El estado sigue replicándose en `localStorage` bajo un contexto llamado `DemoContext`.
- La subida de fotos usa la anon key y depende de políticas de Storage que deben reforzarse.
- `README.md` describe una demo que ya no corresponde al sistema real.

## Alcance de implementación

### 1. Seguridad y autorización - prioridad máxima

Implementar un módulo de autorización de servidor reutilizable.

- Obtener la sesión desde Supabase en cada Server Action o Route Handler sensible.
- No confiar en datos de rol enviados desde el navegador.
- Validar que el usuario autenticado tenga el rol requerido antes de consultar o mutar datos.
- Aplicar controles de propiedad: un cliente solo puede consultar sus propios pedidos y perfil; un vendedor solo sus operaciones autorizadas.
- Proteger rutas privadas en servidor con el patrón recomendado por la versión instalada de Next.js y Supabase SSR. No basar la seguridad exclusivamente en redirecciones de Client Components.
- Mantener los chequeos de UX del cliente solo como complemento, nunca como barrera de seguridad.

Matriz mínima de permisos:

| Operación | Admin | Vendedor | Cliente |
|---|---:|---:|---:|
| Ver catálogo y disponibilidad | Sí | Sí | Sí |
| Crear pedido propio | Sí | Sí | Sí |
| Ver todos los pedidos | Sí | No | No |
| Ver pedido propio | Sí | Solo los asignados/creados | Sí |
| Cambiar estado de pedido | Sí | Según flujo autorizado | No |
| Importar CSV | Sí | No | No |
| Crear/editar productos | Sí | No | No |
| Gestionar clientes y vendedores | Sí | No | No |
| Subir o reemplazar fotos | Sí | No | No |

### 2. Modelo de datos y migraciones

Actualizar el esquema de Prisma con migraciones, sin borrar datos existentes.

#### Producto

Reemplazar o migrar los campos actuales para soportar:

- `priceCop`: entero en pesos colombianos, o `Decimal` si se necesitan centavos. No usar `Float` para dinero.
- `physicalStock`: cantidad informada por el CSV.
- `reservedStock`: cantidad comprometida por pedidos activos.
- `isActive`: permite ocultar referencias que ya no vienen en un archivo completo o están descontinuadas.
- `lastInventoryImportId` opcional para rastrear su última fuente.
- Mantener SKU único, nombre, categoría, ubicación e imágenes.

#### Pedido y líneas de pedido

- Conservar el precio capturado al momento de reservar (`priceAtTime`).
- Añadir estados con validación explícita de transición.
- Añadir `updatedAt` y, si es apropiado, una marca de versión para concurrencia optimista.
- Las líneas deben conservar cantidad solicitada, cantidad aprobada/preparada y razón de ajuste cuando aplique.

#### Auditoría de importaciones

Crear entidades equivalentes a `InventoryImport` e `InventoryImportRow`:

- Importación: id, usuario admin, nombre original, hash, fecha, modo (`incremental` o `snapshot`), estado, totales y errores.
- Fila: número de fila, SKU original/normalizado, datos leídos, acción (`created`, `updated`, `unchanged`, `deactivated`, `invalid`) y mensaje de error.

Registrar además movimientos o eventos de inventario para importaciones, reservas, liberaciones, ajustes y cancelaciones. Deben ser inmutables.

### 3. Flujo de inventario por CSV

Reemplazar el flujo actual de actualización directa por dos fases: previsualización y confirmación.

#### Contrato CSV

Definir y documentar formato soportado. Columnas obligatorias:

```csv
sku,name,category,price_cop,stock,location_code
ANI-001,Anillo clasico,Anillos,45000,25,A-01-01
```

Reglas:

- Normalizar SKU: trim, mayúsculas, sin valores vacíos.
- Exigir SKU único dentro del archivo.
- Exigir nombre, categoría, precio y stock en referencias nuevas.
- Precio: entero mayor o igual a cero.
- Stock: entero mayor o igual a cero.
- Limitar tamaño de archivo y número máximo de filas; informar límites en UI.
- Informar errores por fila, no transformar valores inválidos en cero silenciosamente.
- Mantener soporte temporal para encabezados heredados en español solo si se documenta claramente.

#### Previsualización

1. El administrador carga el archivo.
2. El servidor valida, normaliza y compara contra la base de datos.
3. La interfaz muestra: referencias nuevas, actualizadas, sin cambios, inválidas y, en modo snapshot, ausentes.
4. El administrador escoge explícitamente el modo:
   - **Incremental:** modifica solo SKU presentes.
   - **Snapshot completo:** además desactiva u oculta SKU que no llegan en el archivo, salvo una excepción definida de forma explícita.
5. Nunca aplicar cambios desde el parser del navegador sin confirmación del administrador.

#### Aplicación

- Aplicar la importación dentro de una transacción.
- Crear una auditoría antes/después y conservar las filas de error.
- Usar operaciones por lotes seguras; no construir una transacción gigantesca sin considerar límite de tiempo o conexiones.
- Si el CSV es grande, procesar por chunks dentro de un job o ruta protegida y reportar progreso verificable.
- Informar resumen final y permitir descargar el reporte de errores.
- El botón de imprimir etiquetas debe operar exclusivamente sobre los SKU creados en la importación confirmada.

### 4. Reservas, pedidos y concurrencia

Centralizar creación, modificación, cancelación y cambio de estado de pedido en servicios de servidor.

#### Crear pedido

En una sola transacción:

1. Leer productos solicitados en la base de datos.
2. Verificar que estén activos y que `physicalStock - reservedStock >= cantidad`.
3. Calcular precios y descuento en servidor; no confiar en total ni precio enviados por el cliente.
4. Crear pedido y sus líneas.
5. Incrementar `reservedStock` de cada producto.
6. Registrar movimientos de inventario.

La consulta/actualización debe ser segura ante dos compras simultáneas. Usar transacción con bloqueo o actualización condicional que falle si ya no hay disponibilidad.

#### Cambiar pedido

- Permitir modificaciones de cantidad solo en estados definidos, por ejemplo `Reservado`.
- Al bajar cantidades o cancelar, liberar la diferencia de `reservedStock` en la misma transacción.
- Al subir cantidades, validar disponibilidad antes de reservar el incremento.
- Todo ajuste de bodega debe conservar cantidad original, cantidad final y razón.

#### Estados

Definir una transición explícita y aplicarla en servidor. Propuesta:

`Reservado -> Confirmado -> En preparación -> Pendiente de verificación -> Verificado -> Empacado -> Despachado`

También permitir cancelación desde los estados permitidos, liberando inventario reservado cuando corresponda. No aceptar estados arbitrarios enviados por el cliente.

### 5. Consultas y aislamiento de datos

Separar las consultas actuales por caso de uso; eliminar el endpoint/acción global que entrega todos los datos.

- Catálogo: productos activos, imágenes, precio aplicable y disponibilidad disponible; nunca datos de otros clientes.
- Cliente: solo su perfil y sus propios pedidos.
- Vendedor: catálogo, clientes habilitados necesarios para una venta y pedidos permitidos por su rol.
- Administrador: datos completos, paginados y filtrables.
- Usar paginación y filtros del servidor en catálogo, inventario y pedidos; no cargar toda la base para filtrarla únicamente en el navegador.

No guardar en `localStorage` clientes, pedidos, vendedores ni inventario como fuente de verdad. Se puede conservar únicamente un carrito temporal, asociado a sesión y validado de nuevo al confirmar.

Renombrar `DemoContext` a un nombre de dominio apropiado, por ejemplo `AppContext` o separar hooks por recurso. Eliminar datos mock y flujos de restauración de demo de producción.

### 6. Fotos y Supabase Storage

- Validar rol admin en el servidor antes de procesar cada carga.
- Validar MIME real, tamaño máximo, dimensiones y extensiones permitidas.
- Sanitizar SKU antes de construir el nombre del objeto.
- Preferir URLs firmadas o bucket privado si las fotografías no deben ser públicas; si deben estar públicas, configurar políticas que solo permitan escritura al servicio/admin autorizado.
- No utilizar una anon key como mecanismo de privilegio para sobrescribir archivos.
- Conservar nombres deterministas por SKU solo si las políticas de acceso lo permiten; invalidar caché/versionar cuando se sustituya una imagen.

### 7. Interfaz y experiencia operativa

- El catálogo debe mostrar disponibilidad real, sin publicar stock físico si el negocio no desea revelarlo.
- No permitir agregar ni incrementar cantidades por encima de disponibilidad.
- Al confirmar un pedido, mostrar errores de inventario actualizados si otro pedido tomó las últimas unidades.
- Inventario administrativo debe mostrar stock físico, reservado y disponible, más fecha de última importación.
- El importador debe tener plantilla CSV descargable, explicación de columnas y reporte entendible de errores.
- Reemplazar textos que indiquen “demo”, “procesamiento local” o simulaciones cuando ya no sean ciertos.

### 8. Calidad, pruebas y documentación

- Leer la documentación de la versión instalada de Next.js antes de modificar APIs, middleware, caché o Server Actions.
- Añadir validación de entrada con un esquema tipado (por ejemplo Zod) en todas las mutaciones.
- Añadir pruebas de servicios para:
  - autorización por rol;
  - aislamiento de pedidos de cliente;
  - validación de CSV;
  - modo incremental y snapshot;
  - SKU duplicado, stock negativo, precio inválido y archivo vacío;
  - reserva simultánea de las últimas unidades;
  - cancelación y liberación de stock;
  - cálculo de descuento y precio de pedido;
  - transiciones inválidas de estado.
- Ejecutar lint, chequeo de tipos, migraciones y build de producción antes de entregar.
- Actualizar `README.md` con arquitectura real, variables de entorno, despliegue, roles, flujo CSV, recuperación y formato de archivo.
- Nunca incluir secretos, service role keys ni archivos `.env` en repositorio o logs.

## Orden de trabajo recomendado

1. Documentar decisiones de negocio pendientes: CSV incremental vs snapshot, reglas de cancelación, visibilidad de stock, estados permitidos.
2. Implementar helpers de autenticación/autorización de servidor.
3. Proteger rutas, Server Actions y consultas existentes antes de sumar funciones.
4. Crear migraciones de datos para precio, stock físico, stock reservado e historial/auditoría.
5. Implementar servicio transaccional de reservas y actualizar los flujos de cliente/vendedor.
6. Reemplazar la consulta global por consultas segregadas por rol y paginadas.
7. Implementar importación CSV con staging, preview, confirmación y auditoría.
8. Reforzar flujo de fotografías y políticas de Storage.
9. Limpiar código demo/localStorage y actualizar UI.
10. Añadir pruebas, ejecutar validaciones y actualizar documentación.

## Criterios de aceptación

La implementación se considera terminada solo si se cumple todo lo siguiente:

- Un cliente no puede leer ni mutar datos de otro cliente, ni invocar acciones administrativas.
- Un vendedor no puede importar inventario ni gestionar usuarios sin permiso.
- Un admin puede importar CSV y revisar exactamente qué cambió antes de confirmarlo.
- Los CSV inválidos no cambian la base de datos y generan errores por fila.
- Toda importación deja trazabilidad de quién, cuándo, cómo y qué cambió.
- Un pedido válido reserva stock de forma atómica; dos pedidos concurrentes no pueden sobre-vender una referencia.
- Cancelaciones y ajustes liberan reservas correctamente.
- El catálogo, carrito y ventas validan disponibilidad contra el servidor al confirmar.
- Precios y totales se calculan en servidor sin `Float`.
- Fotografías solo pueden escribirse por usuarios autorizados y bajo políticas de Storage revisadas.
- No quedan accesos a datos globales desde clientes ni textos de demo que contradigan el comportamiento real.
- Lint, typecheck, pruebas relevantes y build de producción pasan correctamente.

## Restricciones

- No borrar información productiva ni aplicar migraciones destructivas sin respaldo y aprobación explícita.
- Mantener compatibilidad de datos existente mediante migraciones seguras y, si se requiere, scripts de backfill reversibles.
- No implementar acceso público al catálogo: esta es una plataforma privada para mayoristas autorizados.
- No asumir una API del inventario externo; el CSV seguirá siendo el único canal de sincronización hasta una decisión futura.
