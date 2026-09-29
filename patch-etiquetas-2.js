const fs = require('fs');

let code = fs.readFileSync('src/app/admin/inventario/imprimir/page.tsx', 'utf8');

// 1. Add pagination states
const targetPagin = `const [searchQuery, setSearchQuery] = useState<string>('');`;
const replacePagin = `const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentDisplayPage, setCurrentDisplayPage] = useState(1);
  const displayItemsPerPage = 50;
  
  useEffect(() => {
    setCurrentDisplayPage(1);
  }, [categoryFilter, materialFilter, searchQuery, newOnly]);`;

if (code.includes(targetPagin)) {
    code = code.replace(targetPagin, replacePagin);
} else {
    console.error("Could not find searchQuery useState");
}

// 2. Compute visibleReferences
const targetCalc = `const allFilteredAreSelected = filteredReferences.length > 0 && filteredReferences.every(p => selectedIds.has(p.id));`;
const replaceCalc = `const allFilteredAreSelected = filteredReferences.length > 0 && filteredReferences.every(p => selectedIds.has(p.id));
  
  const displayTotalPages = Math.ceil(filteredReferences.length / displayItemsPerPage);
  const visibleReferences = filteredReferences.slice((currentDisplayPage - 1) * displayItemsPerPage, currentDisplayPage * displayItemsPerPage);`;

if (code.includes(targetCalc)) {
    code = code.replace(targetCalc, replaceCalc);
} else {
    console.error("Could not find allFilteredAreSelected");
}

fs.writeFileSync('src/app/admin/inventario/imprimir/page.tsx', code);
console.log('Fixed pagination logic in etiquetas');
