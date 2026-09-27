const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n\s*fetchProducts\(true\);\n\s*\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n\s*\}, \[effectiveMaterial, effectiveCategory, searchTerm\]\);/;

const replacement = `useEffect(() => {
    fetchProducts(true);
    
    const handleSilentRefresh = () => {
      // Para mantener el desplazamiento lo mejor es no recargar todo,
      // pero si se necesita refrescar stock, al menos refrescamos la vista.
      fetchProducts(true); 
    };
    
    window.addEventListener('rio:silent_refresh_catalog', handleSilentRefresh);
    return () => window.removeEventListener('rio:silent_refresh_catalog', handleSilentRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMaterial, effectiveCategory, searchTerm]);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log('Added silent refresh listener');
} else {
  console.log('Not found');
}
