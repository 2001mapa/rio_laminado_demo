const fs = require('fs');
let code = fs.readFileSync('src/app/admin/historial/page.tsx', 'utf8');

const replacement = `  const PAYLOAD_KEYS: Record<string, string> = {
    totalProcessed: 'Total Procesados',
    newProducts: 'Nuevos Creados',
    updatedProducts: 'Actualizados',
    warnings: 'Advertencias',
    type: 'Tipo de Foto',
    filename: 'Nombre de Archivo',
    publicUrl: 'URL del Archivo',
    error: 'Detalle del Error'
  };

  return (
    <ul className="space-y-1 bg-white p-3 border border-rio-border rounded-lg">
      {Object.entries(changes).map(([key, value]) => {
        if (key === 'publicUrl' && typeof value === 'string') {
          return (
            <li key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-b border-rio-border/50 last:border-0 pb-2 last:pb-0 pt-1 first:pt-0">
              <span className="font-bold text-rio-muted min-w-[140px] uppercase text-[11px] tracking-wider">
                {PAYLOAD_KEYS[key] || key}
              </span>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-rio-gold-dark font-bold hover:underline truncate max-w-sm">
                Ver archivo adjunto
              </a>
            </li>
          );
        }
        return (
          <li key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-b border-rio-border/50 last:border-0 pb-2 last:pb-0 pt-1 first:pt-0">
            <span className="font-bold text-rio-muted min-w-[140px] uppercase text-[11px] tracking-wider">
              {PAYLOAD_KEYS[key] || key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span className="text-rio-ink font-medium break-all">
              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
            </span>
          </li>
        );
      })}
    </ul>
  );`;

code = code.replace(
  /return\s*\(\s*<pre className="text-\[11px\] text-rio-ink font-mono bg-white p-3 border border-rio-border rounded overflow-x-auto">\s*\{JSON\.stringify\(changes, null, 2\)\}\s*<\/pre>\s*\);/g,
  replacement
);

fs.writeFileSync('src/app/admin/historial/page.tsx', code);
console.log('Fixed viewer');
