# Alertas de RIO en Discord

Configura en Vercel, para Production, `DISCORD_ERROR_WEBHOOK_URL` y `DISCORD_SECURITY_WEBHOOK_URL` como variables privadas de servidor. La primera publica en el canal de errores y la segunda en el de seguridad. Si falta la segunda, las alertas de acceso rechazado usan el canal de errores. No uses el prefijo `NEXT_PUBLIC_`, no guardes las URL en Git y no las compartas por chat. Tras modificar variables, realiza un despliegue nuevo.

Se notifican errores no controlados del servidor, errores no controlados del navegador de usuarios autenticados, algunas operaciones críticas de pedidos y gestión de clientes que fallan, y accesos rechazados después de autenticar por perfil inválido o suspendido. Los fallos de negocio esperados, como validaciones o falta de inventario, no se tratan como incidentes.

Cada aviso puede indicar área, operación, ruta depurada, tipo de error, navegador, resumen depurado, identificador del incidente y repeticiones omitidas. Los errores de navegador incluyen hasta seis navegaciones o botones reconocidos de los 90 segundos anteriores. No se recopila lo escrito en formularios, búsquedas, tallas o cantidades. Las rutas dinámicas se reemplazan por `[id]` y los resúmenes pasan por filtros de secretos y datos personales. Esto ayuda a investigar, pero **no es una grabación completa ni garantiza identificar por sí solo la causa exacta**.

Las alertas son de mejor esfuerzo: si Discord falla, la aplicación continúa. La reducción de duplicados funciona por instancia durante un minuto, no globalmente entre instancias de Vercel. Tampoco detecta una caída total del sitio sin una comprobación externa de disponibilidad.

Los intentos con contraseña incorrecta no generan alertas fiables desde el navegador: podrían falsificarse o inundar Discord. Para monitorizarlos se necesitaría una fuente confiable de eventos de Supabase Auth y un umbral. Las fallas de conexión previstas durante el uso offline tampoco se consideran incidentes.
