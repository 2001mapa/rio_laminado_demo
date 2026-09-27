const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// Fix TypeScript error for createdAt
const oldDiscover = `  const discoverProducts = [...catalogProducts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);`;

const newDiscover = `  const discoverProducts = [...catalogProducts]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);`;

code = code.replace(oldDiscover, newDiscover);

// Add silent listener correctly without regex
const oldEffect = `  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMaterial, effectiveCategory, searchTerm]);`;

const newEffect = `  useEffect(() => {
    fetchProducts(true);
    
    const handleSilentRefresh = () => {
      fetchProducts(true); 
    };
    
    window.addEventListener('rio:silent_refresh_catalog', handleSilentRefresh);
    return () => window.removeEventListener('rio:silent_refresh_catalog', handleSilentRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMaterial, effectiveCategory, searchTerm]);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log('Fixed TS and added silent refresh');
