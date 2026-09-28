const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// 1. Añadir el useState para dynamicMaterials
const stateHookPos = code.indexOf('const [isLoading, setIsLoadingMore] = useState(false);');
if (stateHookPos !== -1) {
  code = code.substring(0, stateHookPos) + 
`const [dynamicMaterials, setDynamicMaterials] = useState<string[]>(['Laminado', 'Plata', 'Rodio']);
    ` + code.substring(stateHookPos);
  console.log('Added dynamicMaterials state');
}

// 2. Reemplazar la asignación dura de clientMaterials
const hardcodedStart = code.indexOf('const canonicalOrder = [\'Laminado\', \'Plata\', \'Rodio\'];');
if (hardcodedStart !== -1) {
  const hardcodedEnd = code.indexOf('const effectiveMaterial = activeMaterial;');
  
  const newMaterialsDef = `const clientMaterials = dynamicMaterials.length > 0 ? ['Todos', ...dynamicMaterials] : ['Todos'];
    // Asegurar que si hay un material activo que ya no está, se pueda deseleccionar
    if (activeMaterial !== 'Todos' && !clientMaterials.includes(activeMaterial)) {
      clientMaterials.push(activeMaterial);
    }
    const showMaterialTabs = clientMaterials.length > 1;
    
    `;
    
  code = code.substring(0, hardcodedStart) + newMaterialsDef + code.substring(hardcodedEnd);
  console.log('Replaced hardcoded materials');
}

// 3. Actualizar dynamicMaterials dentro de fetchProducts
const fetchResStart = code.indexOf('setHasMore(res.hasMore ?? false);');
if (fetchResStart !== -1) {
  const newFetchRes = `setHasMore(res.hasMore ?? false);
        if (reset && res.availableMaterials) {
          setDynamicMaterials(res.availableMaterials);
        }`;
  code = code.substring(0, fetchResStart) + newFetchRes + code.substring(fetchResStart + 33);
  console.log('Updated fetchProducts');
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
