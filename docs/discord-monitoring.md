# Alertas de RIO en Discord

La integración queda inactiva hasta configurar `DISCORD_ERROR_WEBHOOK_URL` como variable **privada** de servidor en el proyecto nuevo de Vercel (Production y, si se desea, Preview). El valor es la URL completa de un webhook de un canal de Discord. No debe llevar el prefijo `NEXT_PUBLIC_`, guardarse en Git ni compartirse por chat. Después de agregarla, hay que generar un deployment nuevo.

Se notifican errores no controlados del servidor, errores no controlados del navegador de usuarios autenticados y accesos rechazados después de una autenticación correcta por perfil inválido o suspendido. El aviso indica la zona (`admin`, `vendedor`, `cliente` o `login`) y la hora. No envía contraseñas, tokens, nombres, pedidos, URL completas ni trazas. Si el webhook no está configurado o falla, la aplicación sigue funcionando.

**Límite importante:** los intentos fallidos de contraseña todavía no generan alertas fiables: Supabase autentica directamente desde el navegador y un aviso emitido por este podría falsificarse o inundar Discord. Para detectar múltiples fallos de login, configurar una fuente confiable de eventos de Supabase Auth (Audit Logs / Log Drain, según el plan) y aplicar un umbral antes de alertar. Las fallas de conexión previstas en el uso offline tampoco se consideran incidentes.

La reducción de duplicados integrada funciona por instancia durante un minuto; no es un límite global entre instancias de Vercel.
