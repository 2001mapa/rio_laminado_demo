const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const regexImports = /import \{\s*getAdminMaterialCounts,\s*getPagedCatalog\s*\} from '@\/app\/actions\/queries';/;
const matchImports = code.match(regexImports);
if (matchImports) {
  code = code.replace(regexImports, "import { getAdminMaterialCounts, getPagedCatalog, getDuplicateLocationsCount } from '@/app/actions/queries';");
}

const regexState = /const \[materialCounts, setMaterialCounts\] = useState<any>\(\{ laminado: 0, plata: 0, rodio: 0, revisar: 0 \}\);/;
const matchState = code.match(regexState);
if (matchState) {
  code = code.replace(regexState, `const [materialCounts, setMaterialCounts] = useState<any>({ laminado: 0, plata: 0, rodio: 0, revisar: 0 });\n  const [duplicateLocations, setDuplicateLocations] = useState(0);`);
}

const regexFetchCounts = /const fetchCounts = async \(\) => \{\n\s*const res = await getAdminMaterialCounts\(\);\n\s*if \(res\.success && res\.counts\) \{\n\s*setMaterialCounts\(res\.counts\);\n\s*\}\n\s*\};/;
const matchFetchCounts = code.match(regexFetchCounts);
if (matchFetchCounts) {
  code = code.replace(regexFetchCounts, `const fetchCounts = async () => {
    const res = await getAdminMaterialCounts();
    if (res.success && res.counts) {
      setMaterialCounts(res.counts);
    }
    const dupRes = await getDuplicateLocationsCount();
    if (dupRes.success) {
      setDuplicateLocations(dupRes.count);
    }
  };`);
}

const regexTabs = /\{ \/\* Tabs & Filters \*\/ \}\n\s*<div className="flex flex-col md:flex-row gap-4 mb-6">/;
const matchTabs = code.match(regexTabs);
if (matchTabs) {
  code = code.replace(regexTabs, `{duplicateLocations > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">Tareas pendientes: Ubicaciones duplicadas</h3>
              <p className="text-sm text-yellow-700 mt-1">Hay {duplicateLocations} ubicación(es) asignadas a múltiples productos. Esto puede causar errores en la preparación de pedidos (picking).</p>
            </div>
          </div>
        )}
        
        { /* Tabs & Filters */ }
        <div className="flex flex-col md:flex-row gap-4 mb-6">`);
}

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('Modified inventario/page.tsx for duplicate locations alert');
