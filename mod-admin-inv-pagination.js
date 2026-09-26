const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const imports = `import { getPagedCatalog } from '@/app/actions/queries';`;

if (!code.includes('getPagedCatalog')) {
  code = code.replace(
    /import Link from 'next\/link';/,
    `import Link from 'next/link';\n${imports}`
  );
  
  const stateHooks = `
  const { refreshData } = useDemo();
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLTableRowElement>(null);
  const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});
  
  const fetchProducts = async (reset = false) => {
    setIsLoading(true);
    try {
      const res: any = await getPagedCatalog({
        material: activeMaterial === 'Todos' ? undefined : activeMaterial,
        search: search || undefined,
        limit: 50,
        cursor: reset ? undefined : cursor,
      });
      if (res.success) {
        setCatalogProducts(prev => reset ? res.products : [...prev, ...res.products]);
        setHasMore(res.hasMore ?? false);
        setCursor(res.nextCursor);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(true);
    }, 300);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMaterial, search]);

  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || isLoading || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchProducts();
      }
    }, { threshold: 0.1 });

    observer.observe(currentLoader);

    return () => observer.unobserve(currentLoader);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasMore, cursor, activeMaterial, search]);

  const filteredProducts = catalogProducts.filter(p => {
    if (locationFilter !== 'Todas') {
      if (locationFilter === 'Sin ubicación' && p.locationCode) return false;
      if (locationFilter !== 'Sin ubicación' && p.locationCode !== locationFilter) return false;
    }
    return true;
  });
`;

  code = code.replace(/const \{ products, refreshData \} = useDemo\(\);/, stateHooks);

  code = code.replace(
    /const locations = Array\.from\(new Set\(products\.map[\s\S]*?Record<string, number>\);/,
    `// Materials and locations are hardcoded or fetched separately in pagination model
    const filterOptions = ['Todas', 'Sin ubicación']; // Static fallback for now since we paginate
    const materials = ['Todos', 'Laminado', 'Plata', 'Rodio', 'Por revisar'];
    const materialCounts = {} as Record<string, number>;`
  );

  // In the table, we add the intersection observer ref at the bottom
  code = code.replace(
    /<\/tbody>/,
    `{hasMore && (
        <tr ref={loaderRef}>
          <td colSpan={6} className="px-6 py-10 text-center text-rio-muted">
             Cargando más productos...
          </td>
        </tr>
      )}
      </tbody>`
  );

  fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
  console.log("Refactored admin inventory page to use server pagination");
} else {
  console.log("Already refactored");
}
