const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/ClientLayout.tsx', 'utf8');

const regex = /setKnownProductIds\(new Set\(products\.map\(p => p\.id\)\)\);[\s\S]*?setProductStocks\(initialStocks\);\n\s*\}\n\s*\}, \[isLoaded, orders, products, currentCustomer, knownStatuses\]\);/;

const replacement = `// Fetch product baseline silently
      getClientActiveProductsDigest().then(resProd => {
         if (resProd.success && resProd.products) {
            const fetchedP = resProd.products as {id: string, physicalStock: number, reservedStock: number}[];
            setKnownProductIds(new Set(fetchedP.map(p => p.id)));
            const initialStocks: Record<string, {p: number, r: number}> = {};
            fetchedP.forEach(p => { initialStocks[p.id] = { p: p.physicalStock, r: p.reservedStock }; });
            setProductStocks(initialStocks);
         }
      });
    }
  }, [isLoaded, orders, currentCustomer, knownStatuses]);`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/app/cliente/ClientLayout.tsx', code);
  console.log('Fixed ClientLayout baseline');
} else {
  console.log('Failed to match ClientLayout baseline');
}
