const fs = require('fs');

let pageCode = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

// Import getAdminMaterialCounts
if (!pageCode.includes('getAdminMaterialCounts')) {
  pageCode = pageCode.replace(
    /import \{ getPagedCatalog \} from '@\/app\/actions\/queries';/,
    `import { getPagedCatalog, getAdminMaterialCounts } from '@/app/actions/queries';`
  );
}

// Add state and fetch logic
const replacementState = `
  const [showCSV, setShowCSV] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLTableRowElement>(null);

  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({ Todos: 0, Laminado: 0, Plata: 0, Rodio: 0, 'Por revisar': 0 });
  const [locationFilter, setLocationFilter] = useState<string>('Todas');
  const [search, setSearch] = useState<string>('');
  const [activeMaterial, setActiveMaterial] = useState<string>('Todos');

  const fetchCounts = async () => {
    const res = await getAdminMaterialCounts();
    if (res.success && res.counts) {
      setMaterialCounts(res.counts);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);
`;

// Replace the old state declarations
pageCode = pageCode.replace(
  /const \[showCSV, setShowCSV\] = useState\(false\);[\s\S]*?const \[activeMaterial, setActiveMaterial\] = useState<string>\('Todos'\);/,
  replacementState
);

// Remove the old local materialCounts
pageCode = pageCode.replace(
  /const materialCounts = \{\} as Record<string, number>;/,
  ``
);

fs.writeFileSync('src/app/admin/inventario/page.tsx', pageCode);
console.log('Fixed InventarioPage to load materialCounts');
