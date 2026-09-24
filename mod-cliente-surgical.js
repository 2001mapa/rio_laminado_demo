const fs = require('fs');

let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// Add import
if (!code.includes('OFFICIAL_PRODUCT_TYPES')) {
  code = code.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport { OFFICIAL_PRODUCT_TYPES } from '@/lib/constants';"
  );
}

// Replace logic
const logicRegex = /const availableProducts = products\.filter\([\s\S]*?const clientMaterials = \['Todos', 'Laminado', 'Plata', 'Rodio'\];/;

const logicReplacement = `
  // 1. Base visible products (active, photo, stock > 0, not "Por revisar")
  const allVisibleProducts = products.filter(p => p.isActive && p.imageUrl && p.material !== 'Por revisar' && (p.physicalStock - p.reservedStock) > 0);

  // 2. Calculate available materials
  const rawMaterials = Array.from(new Set(allVisibleProducts.map(p => p.material))).filter(Boolean) as string[];
  const canonicalOrder = ['Laminado', 'Plata', 'Rodio'];
  const allAvailableMaterials = canonicalOrder.filter(m => rawMaterials.includes(m));

  // Determine effective material
  let effectiveMaterial = activeMaterial;
  if (allAvailableMaterials.length === 1) {
    effectiveMaterial = allAvailableMaterials[0];
  } else if (!allAvailableMaterials.includes(activeMaterial) && activeMaterial !== 'Todos') {
    effectiveMaterial = allAvailableMaterials.length > 0 ? allAvailableMaterials[0] : 'Todos';
  }

  const showMaterialTabs = allAvailableMaterials.length > 1;
  const clientMaterials = showMaterialTabs ? ['Todos', ...allAvailableMaterials] : [];

  // 3. Calculate available types based on effective material
  const productsForMaterial = allVisibleProducts.filter(p => effectiveMaterial === 'Todos' || p.material === effectiveMaterial);
  // Sort types according to OFFICIAL_PRODUCT_TYPES order
  const rawTypes = Array.from(new Set(productsForMaterial.map(p => p.category))).filter(Boolean);
  const availableTypes = OFFICIAL_PRODUCT_TYPES.filter(t => rawTypes.includes(t));
  rawTypes.forEach(t => { if (!OFFICIAL_PRODUCT_TYPES.includes(t)) availableTypes.push(t) });

  let effectiveCategory = activeCategory;
  if (effectiveCategory !== 'Todos' && !availableTypes.includes(effectiveCategory)) {
    effectiveCategory = 'Todos';
  }

  useEffect(() => {
    if (activeMaterial !== effectiveMaterial) setActiveMaterial(effectiveMaterial);
    if (activeCategory !== effectiveCategory) setActiveCategory(effectiveCategory);
  }, [effectiveMaterial, effectiveCategory, activeMaterial, activeCategory]);

  const availableProducts = productsForMaterial;
  const categories = availableTypes; // Just to avoid breaking any other map if there is one
`;

code = code.replace(logicRegex, logicReplacement);

// Replace filteredProducts logic which is a bit down
const filteredRegex = /const filteredProducts = availableProducts\.filter\([\s\S]*?return true;\s*\}\);/;
const filteredReplacement = `const filteredProducts = availableProducts.filter(p => {
    if (effectiveCategory !== 'Todos' && p.category !== effectiveCategory) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s);
    }
    return true;
  });`;

code = code.replace(filteredRegex, filteredReplacement);

// Replace the Filters Toolbar UI
const uiRegex = /\{\/\* Materials, Category Tabs & Search \*\/\}([\s\S]*?)\{\/\* Grid de Productos \*\/\}/;

const uiReplacement = `{/* Filters Toolbar */}
        <div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-3 pb-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-rio-border/50 md:border-rio-border flex flex-col gap-3">
          
          {/* Material Tabs (Horizontal scroll on mobile) */}
          {showMaterialTabs && (
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
              {clientMaterials.map((mat) => (
                <button
                  key={mat}
                  onClick={() => { setActiveMaterial(mat); setActiveCategory('Todos'); }}
                  className={\`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all \${
                    effectiveMaterial === mat
                      ? 'bg-rio-ink text-white shadow-md'
                      : 'bg-white text-rio-ink border border-rio-border hover:bg-rio-surface-muted'
                  }\`}
                >
                  {mat}
                </button>
              ))}
            </div>
          )}

          {/* Type Select and Search Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <select
              value={effectiveCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-rio-border rounded-xl text-[13px] font-bold text-rio-ink focus:outline-none focus:ring-1 focus:ring-rio-ink md:min-w-[200px]"
            >
              <option value="Todos">Todos los tipos</option>
              {availableTypes.map(type => (
                 <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <div className="relative w-full md:flex-1 md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-rio-muted" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2.5 border border-rio-border rounded-xl text-sm bg-rio-surface placeholder-rio-muted focus:outline-none focus:ring-1 focus:ring-rio-ink focus:border-rio-ink text-rio-ink shadow-sm"
                  placeholder="Buscar por nombre o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </div>

        {/* Grid de Productos */}`;

code = code.replace(uiRegex, uiReplacement);

// Replace grid mapping logic
const gridMapRegex = /categories\.filter\(c => c !== 'Todos'\)\.map\(category => \{[\s\S]*?const categoryProducts = filteredProducts\.filter\(p => p\.category === category\);/;
const gridMapReplacement = `(effectiveCategory === 'Todos' ? availableTypes : [effectiveCategory]).map(category => {
                const categoryProducts = filteredProducts.filter(p => p.category === category);`;
code = code.replace(gridMapRegex, gridMapReplacement);


fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Surgical update completed');
