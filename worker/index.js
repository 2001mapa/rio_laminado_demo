self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Mantener estrictamente solo los cachés estáticos anónimos
          const isSafe = cacheName.includes('next-static-assets') || 
                         cacheName.includes('google-fonts') || 
                         cacheName.includes('static-font-assets') ||
                         cacheName.includes('static-image-assets') ||
                         cacheName.includes('workbox'); // Workbox maneja su propio cleanup

          if (!isSafe) {
            console.log('[SW Activate] Purging unauthorized/private cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomamos control solo si clientsClaim no estuviera en false en Next config,
      // pero respetamos que el user cierre la pestaña para actualizar sin romper.
    })
  );
});
