const fs = require('fs');

let code = fs.readFileSync('src/app/admin/inventario/imprimir/page.tsx', 'utf8');

// 1. Add pagination states
const targetPagin = `const [searchQuery, setSearchQuery] = useState('');`;
const replacePagin = `const [searchQuery, setSearchQuery] = useState('');
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
const targetCalc = `const allFilteredAreSelected = filteredReferences.length > 0 && filteredReferences.every(r => selectedIds.has(r.id));`;
const replaceCalc = `const allFilteredAreSelected = filteredReferences.length > 0 && filteredReferences.every(r => selectedIds.has(r.id));
  
  const displayTotalPages = Math.ceil(filteredReferences.length / displayItemsPerPage);
  const visibleReferences = filteredReferences.slice((currentDisplayPage - 1) * displayItemsPerPage, currentDisplayPage * displayItemsPerPage);`;

if (code.includes(targetCalc)) {
    code = code.replace(targetCalc, replaceCalc);
} else {
    console.error("Could not find allFilteredAreSelected");
}

// 3. Replace mapping
code = code.replace(/filteredReferences\.map\(/g, "visibleReferences.map(");

// 4. Add pagination controls
const targetEndMap = `</div>
                </div>
              </div>`; // wait, better to find the end of the mapping

const paginationUI = `
                  {displayTotalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 p-2 bg-rio-surface-muted rounded-xl border border-rio-border">
                       <button 
                         onClick={() => setCurrentDisplayPage(p => Math.max(1, p - 1))}
                         disabled={currentDisplayPage === 1}
                         className="px-3 py-1 rounded border border-rio-border bg-white text-rio-ink disabled:opacity-50 text-sm font-medium"
                       >
                         Anterior
                       </button>
                       <span className="text-[12px] font-medium text-rio-muted">
                         Página {currentDisplayPage} de {displayTotalPages}
                       </span>
                       <button 
                         onClick={() => setCurrentDisplayPage(p => Math.min(displayTotalPages, p + 1))}
                         disabled={currentDisplayPage === displayTotalPages}
                         className="px-3 py-1 rounded border border-rio-border bg-white text-rio-ink disabled:opacity-50 text-sm font-medium"
                       >
                         Siguiente
                       </button>
                    </div>
                  )}
`;

// Let's find where the map ends
code = code.replace(
  "                  {filteredReferences.length === 0 && (", // wait, now visibleReferences.length === 0
  paginationUI + "\n                  {visibleReferences.length === 0 && ("
);

// We should also change filteredReferences.length === 0 check to visibleReferences? No, if filtered is 0, visible is 0.
code = code.replace(
  "{filteredReferences.length === 0 && (",
  "{filteredReferences.length === 0 && ("
);

fs.writeFileSync('src/app/admin/inventario/imprimir/page.tsx', code);
console.log('Added pagination to etiquetas');
