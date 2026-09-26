const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// I will extract the inserted block (from `const fetchProducts` to the `filteredProducts` declaration) and move it below `setShowPhotos`.
// Or just move `const [search...` up.
code = code.replace(
  /const \[locationFilter, setLocationFilter\] = useState<string>\('Todas'\);\n  const \[search, setSearch\] = useState<string>\(''\);\n  const \[activeMaterial, setActiveMaterial\] = useState<string>\('Todos'\);/,
  ''
);

code = code.replace(
  /const \[totalCounts, setTotalCounts\] = useState<Record<string, number>>\(\{\}\);/,
  `const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});
  const [locationFilter, setLocationFilter] = useState<string>('Todas');
  const [search, setSearch] = useState<string>('');
  const [activeMaterial, setActiveMaterial] = useState<string>('Todos');`
);

fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
