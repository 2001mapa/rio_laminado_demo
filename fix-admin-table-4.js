const fs = require('fs');

// 1. Fix queries.ts
let qCode = fs.readFileSync('src/app/actions/queries.ts', 'utf8');
qCode = qCode.replace("return { success: false, count: 0 };", "return { success: false, count: 0, locations: [] };");
fs.writeFileSync('src/app/actions/queries.ts', qCode);

// 2. Fix page.tsx state
let pCode = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');
const searchStr = "const [locationFilter, setLocationFilter] = useState<string>('Todas');";
if (pCode.includes(searchStr)) {
  pCode = pCode.replace(searchStr, "const [locationFilter, setLocationFilter] = useState<string>('Todas');\n  const [duplicateLocationCodes, setDuplicateLocationCodes] = useState<string[]>([]);");
  fs.writeFileSync('src/app/admin/inventario/page.tsx', pCode);
  console.log('Fixed page.tsx state');
} else {
  console.log('Could not find locationFilter state');
}
