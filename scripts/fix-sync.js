const fs = require('fs');
let content = fs.readFileSync('src/lib/useOfflineSync.ts', 'utf8');

const regex = /\/\/ Fallback seguro usando LocalStorage para locks si Web Locks no existe/g;

const newStr = `// Fallback usando LocalStorage para navegadores sin Web Locks.
          // NOTA DE SEGURIDAD: La lectura/escritura en LocalStorage no es atómica. 
          // En un escenario de carrera (race condition) muy ajustado, dos pestañas 
          // podrían leer null simultáneamente y ambas enviar la petición al servidor.
          // Esto es SEGURO únicamente porque el servidor actúa como autoridad final de 
          // idempotencia utilizando el clientRequestId. El servidor procesará la primera
          // petición y devolverá error en la segunda, previniendo duplicados.`;

content = content.replace(regex, newStr);

fs.writeFileSync('src/lib/useOfflineSync.ts', content);
