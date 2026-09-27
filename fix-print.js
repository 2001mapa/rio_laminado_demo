const fs = require('fs');

let pageCode = fs.readFileSync('src/app/admin/inventario/imprimir/page.tsx', 'utf8');

// Import getPrintableProducts
if (!pageCode.includes('getPrintableProducts')) {
  pageCode = pageCode.replace(
    /import \{ useDemo \} from '@\/lib\/DemoContext';/,
    `import { useDemo } from '@/lib/DemoContext';\nimport { getPrintableProducts } from '@/app/actions/queries';`
  );
}

// Replace products extraction
const stateReplacement = `
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    getPrintableProducts().then(res => {
      if (res.success && res.products) {
        setProducts(res.products);
      }
      setIsLoadingProducts(false);
    });
  }, []);
`;

pageCode = pageCode.replace(
  /const \{ products \} = useDemo\(\);/,
  stateReplacement
);

fs.writeFileSync('src/app/admin/inventario/imprimir/page.tsx', pageCode);
console.log('Fixed MassPrintPage to load products from server');
