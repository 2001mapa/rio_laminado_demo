const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// Update variable definitions
const regexVars = /const categories = \['Todos', \.\.\.Array\.from\(new Set\(products\.filter\(p => p\.imageUrl\)\.map\(p => p\.category\)\)\)\];\s*const availableProducts = products\.filter\(p => \{\s*if \(activeMaterial !== 'Todos' && p\.material !== activeMaterial\) return false;\s*if \(\!p\.imageUrl\) return false;\s*const stockDisponible = p\.physicalStock - p\.reservedStock;\s*if \(stockDisponible <= 0\) return false;\s*return true;\s*\}\);/;

const replacementVars = `const availableProducts = products.filter(p => {
    if (p.material === 'Por revisar') return false;
    if (activeMaterial !== 'Todos' && p.material !== activeMaterial) return false;
    if (!p.imageUrl) return false;
    const stockDisponible = p.physicalStock - p.reservedStock;
    if (stockDisponible <= 0) return false;
    return true;
  });

  const categories = ['Todos', ...Array.from(new Set(availableProducts.map(p => p.category)))];
  
  const clientMaterials = ['Todos', 'Laminado', 'Plata', 'Rodio'];`;

code = code.replace(regexVars, replacementVars);

// Add Material Tabs
const regexTabs = /\{\/\* Category Tabs & Search \*\/\}\s*<div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-rio-border\/50 md:border-rio-border">/;

const replacementTabs = `{/* Materials, Category Tabs & Search */}
          <div className="sticky top-14 md:top-0 z-20 bg-rio-background pt-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-rio-border/50 md:border-rio-border">
            {/* Materials Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
              {clientMaterials.map((mat) => (
                <button
                  key={mat}
                  onClick={() => { setActiveMaterial(mat); setActiveCategory('Todos'); }}
                  className={\`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all \${
                    activeMaterial === mat
                      ? 'bg-rio-ink text-white shadow-md'
                      : 'bg-white text-rio-ink border border-rio-border hover:bg-rio-surface-muted'
                  }\`}
                >
                  {mat}
                </button>
              ))}
            </div>`;

code = code.replace(regexTabs, replacementTabs);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Cliente catalog updated');
