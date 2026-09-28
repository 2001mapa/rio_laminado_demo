const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// 1. Update state to string array
const stateRegex = /const \[duplicateLocations, setDuplicateLocations\] = useState\(0\);/;
if (code.match(stateRegex)) {
  code = code.replace(stateRegex, "const [duplicateLocationCodes, setDuplicateLocationCodes] = useState<string[]>([]);");
}

// 2. Update fetch logic
const fetchRegex = /if \(dupRes\.success\) \{\n\s*setDuplicateLocations\(dupRes\.count\);\n\s*\}/;
if (code.match(fetchRegex)) {
  code = code.replace(fetchRegex, "if (dupRes.success && dupRes.locations) {\n      setDuplicateLocationCodes(dupRes.locations);\n    }");
}

// 3. Update top banner logic
const bannerRegex = /\{duplicateLocations > 0 && \([\s\S]*?\{duplicateLocations\} ubicación\(es\) asignadas[\s\S]*?<\/div>\n\s*\)\}/;
if (code.match(bannerRegex)) {
  code = code.replace(bannerRegex, `{duplicateLocationCodes.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">Tareas pendientes: Ubicaciones duplicadas</h3>
              <p className="text-sm text-yellow-700 mt-1">Hay {duplicateLocationCodes.length} ubicación(es) asignadas a múltiples productos. Búscalos en la tabla por la marca roja y corrígelos para evitar errores de envío.</p>
            </div>
          </div>
        )}`);
}

// 4. Find where locationCode is displayed in the table and add the red badge
const tdRegex = /<td className="px-6 py-4">\n\s*<div className="flex items-center space-x-2 text-sm">\n\s*<MapPin className="w-4 h-4 text-rio-muted" \/>\n\s*<span className=\{product\.locationCode \? 'text-rio-ink' : 'text-rio-muted italic'\}>\n\s*\{product\.locationCode \|\| 'Sin ubicación'\}\n\s*<\/span>\n\s*<\/div>\n\s*<\/td>/;

// Wait, I am not completely sure what the exact HTML inside the table cell looks like.
// Let me first extract the table row logic to make sure I don't break it.
fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
