const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const regexFetchCounts = /const fetchCounts = async \(\) => \{\s*const res = await getAdminMaterialCounts\(\);\s*if \(res\.success && res\.counts\) \{\s*setMaterialCounts\(res\.counts\);\s*\}\s*\};/;
code = code.replace(regexFetchCounts, `const fetchCounts = async () => {
    const res = await getAdminMaterialCounts();
    if (res.success && res.counts) {
      setMaterialCounts(res.counts);
    }
    const dupRes = await getDuplicateLocationsCount();
    if (dupRes.success && dupRes.locations) {
      setDuplicateLocationCodes(dupRes.locations);
    }
  };`);

const regexBanner = /\{ duplicateLocations > 0 && \([\s\S]*?<\/div>\s*\)\s*\}/; // wait I might not have added the banner if my regex failed. Let's check what's above `{ /* Tabs & Filters */ }`

const tabsStart = code.indexOf('{ /* Tabs & Filters */ }');
if (tabsStart !== -1) {
  // Check if I already injected a banner
  const bannerTest = code.indexOf('Tareas pendientes: Ubicaciones duplicadas');
  if (bannerTest === -1) {
    const bannerCode = `{duplicateLocationCodes.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">Tareas pendientes: Ubicaciones duplicadas</h3>
              <p className="text-sm text-yellow-700 mt-1">Hay {duplicateLocationCodes.length} ubicación(es) asignadas a múltiples productos. Búscalos en la tabla por la marca roja y corrígelos para evitar errores de envío.</p>
            </div>
          </div>
        )}
        `;
    code = code.substring(0, tabsStart) + bannerCode + code.substring(tabsStart);
  } else {
    // If it exists, replace duplicateLocations with duplicateLocationCodes.length
    code = code.replace(/\{duplicateLocations > 0/g, '{duplicateLocationCodes.length > 0');
    code = code.replace(/Hay \{duplicateLocations\}/g, 'Hay {duplicateLocationCodes.length}');
  }
}

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('Fixed fetchCounts and banner');
