const fs = require('fs');
let code = fs.readFileSync('src/app/admin/historial/page.tsx', 'utf8');

const replacement = `
    if (changes.before && changes.after) {
      const keys = Array.from(new Set([...Object.keys(changes.before), ...Object.keys(changes.after)]));
      const differences = keys.filter(k => JSON.stringify(changes.before[k]) !== JSON.stringify(changes.after[k]));
      
      if (differences.length === 0) return <div className="text-sm text-rio-muted italic">Sin cambios detectados (solo guardado).</div>;
  
      return (
        <div className="space-y-2">
          <p className="text-xs text-rio-muted">Se detectaron modificaciones en los siguientes campos:</p>
          <ul className="space-y-1">
            {differences.map(k => (
              <li key={k} className="text-sm flex flex-col md:flex-row md:items-center gap-1 md:gap-3 bg-white p-2 rounded border border-rio-border">
                <span className="font-bold text-rio-ink min-w-[120px] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-rio-danger bg-rio-danger/10 px-2 py-0.5 rounded truncate max-w-[200px]" title={String(changes.before[k])}>
                    {changes.before[k] === null ? 'vacío' : String(changes.before[k])}
                  </span>
                  <span className="text-rio-muted">→</span>
                  <span className="text-rio-success bg-rio-success/10 px-2 py-0.5 rounded truncate max-w-[200px]" title={String(changes.after[k])}>
                    {changes.after[k] === null ? 'vacío' : String(changes.after[k])}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    const PAYLOAD_KEYS: Record<string, string> = {
      totalProcessed: 'Total Procesados',
      newProducts: 'Nuevos Creados',
      updatedProducts: 'Actualizados',
      warnings: 'Advertencias',
      type: 'Tipo de Foto',
      filename: 'Nombre de Archivo',
      publicUrl: 'URL',
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
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-rio-gold-dark font-bold hover:underline truncate max-w-sm">Ver archivo</a>
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
    );
`;

code = code.replace(
  /if \(changes\.before && changes\.after\) \{[\s\S]*?return \(\s*<pre className="text-\[11px\][\s\S]*?<\/pre>\s*\);\s*\}/,
  replacement.trim()
);

fs.writeFileSync('src/app/admin/historial/page.tsx', code);
console.log('Fixed JSON viewer');
