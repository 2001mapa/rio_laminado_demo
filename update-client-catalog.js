const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const regexCategory = /const \[activeCategory, setActiveCategory\] = useState<string>\('Todos'\);/;
const replaceCategory = `const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeMaterial, setActiveMaterial] = useState<string>('Todos');`;

code = code.replace(regexCategory, replaceCategory);

const filterRegex = /const availableProducts = products\.filter\(p => \{([\s\S]*?)\}\);/;
const replaceFilter = `const availableProducts = products.filter(p => {
    if (!p.imageUrl) return false;
    const stockDisponible = p.physicalStock - p.reservedStock;
    if (stockDisponible <= 0) return false;
    if (activeMaterial !== 'Todos' && p.material !== activeMaterial) return false;
$1
  });`;

// Oops, better just use explicit replace
code = code.replace(/const availableProducts = products\.filter\(p => \{/g, `const availableProducts = products.filter(p => {
    if (activeMaterial !== 'Todos' && p.material !== activeMaterial) return false;`);

// I also need to add material selector UI
const uiRegex = /<div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">/;
const replaceUi = `<div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
            {['Todos', 'Laminado', 'Plata', 'Rodio'].map((mat) => (
              <button
                key={mat}
                onClick={() => setActiveMaterial(mat)}
                className={\`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all \${
                  activeMaterial === mat
                    ? 'bg-rio-ink text-white shadow-md'
                    : 'bg-white text-rio-ink border border-rio-border hover:bg-rio-surface-muted hover:border-rio-border/80'
                }\`}
              >
                {mat}
              </button>
            ))}
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">`;

code = code.replace(uiRegex, replaceUi);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('cliente catalog updated');
