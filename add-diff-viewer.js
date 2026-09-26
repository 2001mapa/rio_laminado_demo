const fs = require('fs');
let content = fs.readFileSync('src/app/admin/historial/page.tsx', 'utf8');

const diffComponent = `
// Helper to render object diffs in a friendly way
function ChangesViewer({ changes }: { changes: any }) {
  if (!changes || typeof changes !== 'object') return <pre className="text-[11px] font-mono">{JSON.stringify(changes, null, 2)}</pre>;
  
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

  return (
    <pre className="text-[11px] text-rio-ink font-mono bg-white p-3 border border-rio-border rounded overflow-x-auto">
      {JSON.stringify(changes, null, 2)}
    </pre>
  );
}
`;

if (!content.includes('ChangesViewer')) {
  content = content.replace(
    /export default function HistorialPage/,
    `${diffComponent}\nexport default function HistorialPage`
  );
  
  // Replace the pre tag rendering changes with ChangesViewer
  content = content.replace(
    /<pre className="text-\[11px\] text-rio-ink font-mono bg-rio-background p-3 border border-rio-border rounded overflow-x-auto">\s*\{JSON\.stringify\(ev\.changes, null, 2\)\}\s*<\/pre>/,
    `<ChangesViewer changes={ev.changes} />`
  );
  
  fs.writeFileSync('src/app/admin/historial/page.tsx', content);
  console.log('Added ChangesViewer');
}
