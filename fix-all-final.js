const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// 1. Dynamic materials
const stateHookPos = code.indexOf('const [isLoading, setIsLoadingMore] = useState(false);');
if (stateHookPos !== -1) {
  code = code.substring(0, stateHookPos) + 
`const [dynamicMaterials, setDynamicMaterials] = useState<string[]>(['Laminado', 'Plata', 'Rodio']);
  ` + code.substring(stateHookPos);
}

const hardcodedStart = code.indexOf('const canonicalOrder = [\'Laminado\', \'Plata\', \'Rodio\'];');
if (hardcodedStart !== -1) {
  const hardcodedEnd = code.indexOf('const effectiveMaterial = activeMaterial;');
  const newMaterialsDef = `const clientMaterials = dynamicMaterials.length > 0 ? ['Todos', ...dynamicMaterials] : ['Todos'];
  if (activeMaterial !== 'Todos' && !clientMaterials.includes(activeMaterial)) {
    clientMaterials.push(activeMaterial);
  }
  const showMaterialTabs = clientMaterials.length > 1;
  `;
  code = code.substring(0, hardcodedStart) + newMaterialsDef + code.substring(hardcodedEnd);
}

const fetchResStart = code.indexOf('setHasMore(res.hasMore ?? false);');
if (fetchResStart !== -1) {
  const newFetchRes = `setHasMore(res.hasMore ?? false);
      if (reset && res.availableMaterials) {
        setDynamicMaterials(res.availableMaterials);
      }`;
  code = code.substring(0, fetchResStart) + newFetchRes + code.substring(fetchResStart + 33);
}

// 2. handleAdd rings fix
const handleAddRegex = /const handleAdd = \(\) => \{\s*const stockDisponible = product\.physicalStock - product\.reservedStock;/;
const match = code.match(handleAddRegex);
if (match) {
  code = code.replace(handleAddRegex, `const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible = product.physicalStock - product.reservedStock;`);
}

// 3. Footer rings fix
const startStr = '<div className="mt-3.5 flex items-center gap-2">';
const endStr = 'onClick={handleAdd}';

const start = code.indexOf(startStr);
const end = code.indexOf(endStr, start);

if (start !== -1 && end !== -1) {
  const newFooter = `<div className="mt-3.5 flex items-center gap-2">
          {product.category === 'Anillos' ? (
            <button
              onClick={onExpand}
              className="flex-1 h-9 rounded-xl border border-rio-border bg-rio-surface text-rio-ink font-bold text-[13px] hover:border-rio-gold hover:text-rio-gold transition-colors"
            >
              Seleccionar tallas
            </button>
          ) : (
            <div className="flex items-center border border-rio-border rounded-xl overflow-hidden bg-rio-background flex-1 h-9">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold flex-1 text-center text-rio-ink">{quantity}</span>
              <button onClick={() => { const s = product.physicalStock - product.reservedStock; if(quantity + currentCartQuantity < s) setQuantity(quantity + 1); }} className="w-8 h-full flex justify-center items-center text-rio-muted hover:bg-rio-border active:bg-rio-border/80 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            `;
  code = code.substring(0, start) + newFooter + code.substring(end);
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Fixed everything smoothly.');
