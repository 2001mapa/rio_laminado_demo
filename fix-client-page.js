const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const oldMats = `  const canonicalOrder = ['Laminado', 'Plata', 'Rodio'];
  const allAvailableMaterials = canonicalOrder;
  const showMaterialTabs = allAvailableMaterials.length > 1;
  const clientMaterials = showMaterialTabs ? ['Todos', ...allAvailableMaterials] : [];
  const effectiveMaterial = activeMaterial;`;

const newMats = `  const [clientMaterials, setClientMaterials] = useState<string[]>(['Todos']);
  const showMaterialTabs = clientMaterials.length > 1;
  const effectiveMaterial = activeMaterial;`;

code = code.replace(oldMats, newMats);

// Update fetchProducts to use availableMaterials and update state
const oldFetch = `        setCatalogProducts((prev: Product[]) => reset ? fetchedProducts : [...prev, ...fetchedProducts]);
        setHasMore(res.hasMore ?? false);
        setCursor(res.nextCursor);
      } else {`;

const newFetch = `        setCatalogProducts((prev: Product[]) => reset ? fetchedProducts : [...prev, ...fetchedProducts]);
        setHasMore(res.hasMore ?? false);
        setCursor(res.nextCursor);
        if (res.availableMaterials) {
           setClientMaterials(['Todos', ...res.availableMaterials]);
        }
      } else {`;

code = code.replace(oldFetch, newFetch);

// Update 'Descubre la colección' to get real new items, not just the first 8 of the page
// Well, we can just sort catalogProducts by createdAt locally for the discover carousel, or rely on a new fetch.
// Actually, it's easier to just take catalogProducts and sort by date.
const oldDiscover = `  const discoverProducts = catalogProducts.slice(0, 8);`;
const newDiscover = `  // Descubre la colección (Novedades reales)
  const discoverProducts = [...catalogProducts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);`;

code = code.replace(oldDiscover, newDiscover);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Fixed client page materials and discover');
