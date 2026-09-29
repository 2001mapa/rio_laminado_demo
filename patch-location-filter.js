const fs = require('fs');

let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// 1. Add locationFilter to fetchProducts dependencies and call
const fetchProdTarget = `const res: any = await getPagedCatalog({
        material: activeMaterial === 'Todos' ? undefined : activeMaterial,
        search: search || undefined,
        limit: 50,
        cursor: reset ? undefined : cursor,
      });`;
const fetchProdReplace = `const res: any = await getPagedCatalog({
        material: activeMaterial === 'Todos' ? undefined : activeMaterial,
        search: search || undefined,
        limit: 50,
        cursor: reset ? undefined : cursor,
        location: locationFilter !== 'Todas' ? locationFilter : undefined
      });`;
code = code.replace(fetchProdTarget, fetchProdReplace);

const useEffTarget = `}, [activeMaterial, search]);`;
const useEffReplace = `}, [activeMaterial, search, locationFilter]);`;
code = code.replace(useEffTarget, useEffReplace);

// 2. Remove client-side filtering completely!
const clientFilterTarget = `const filteredProducts = catalogProducts.filter(p => {
    if (locationFilter !== 'Todas') {
      if (locationFilter === 'Sin ubicación' && p.locationCode) return false;
      if (locationFilter !== 'Sin ubicación' && p.locationCode !== locationFilter) return false;
    }
    return true;
  });`;

// Wait, the emoji encoding issues could be present, let's just use regex.
code = code.replace(/const filteredProducts = catalogProducts\.filter\([\s\S]*?return true;\n  \}\);/, '');

// Replace `filteredProducts.map` with `catalogProducts.map`
code = code.replace(/filteredProducts\.map/g, 'catalogProducts.map');
code = code.replace(/filteredProducts\.length/g, 'catalogProducts.length');

// 3. Update the UI from select to input + datalist
const selectTarget = `<select
            className="block px-4 py-2.5 border border-rio-border rounded-xl text-[13px] font-medium focus:ring-1 focus:ring-rio-gold focus:border-rio-gold appearance-none bg-white text-rio-ink"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            {filterOptions.map(loc => (
              <option key={loc} value={loc}>{loc === 'Todas' ? 'Todas las ubicaciones' : loc}</option>
            ))}
          </select>`;

const selectReplace = `<div>
            <input
              type="text"
              list="location-list"
              placeholder="Filtro ubicación..."
              className="block w-48 px-4 py-2.5 border border-rio-border rounded-xl text-[13px] font-medium focus:ring-1 focus:ring-rio-gold focus:border-rio-gold bg-white text-rio-ink"
              value={locationFilter === 'Todas' ? '' : locationFilter}
              onChange={(e) => setLocationFilter(e.target.value || 'Todas')}
            />
            <datalist id="location-list">
              <option value="Sin ubicación" />
            </datalist>
          </div>`;
          
code = code.replace(/<select[\s\S]*?<\/select>/, selectReplace);

// The "Por revisar" tab requirement: "presenta el desglose y la causa por producto para que 2.278/2.301 no se interprete como 2.278 materiales incorrectos"
// Let's modify the UI for "Por revisar" items to show a label about WHY it's there.
// If activeMaterial === 'Por revisar' or generally, we can render a small badge next to the material.
// But first, let's save the locationFilter changes.

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('Fixed location filtering in inventario');
