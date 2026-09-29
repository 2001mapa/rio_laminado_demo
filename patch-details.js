const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  if (code.includes('import { getOrderById }')) {
    console.log('Already patched', filepath);
    return;
  }
  
  code = code.replace(
    "import { useDemo } from '@/lib/DemoContext';",
    "import { useDemo } from '@/lib/DemoContext';\nimport { getOrderById } from '@/app/actions/orders';"
  );
  
  const searchFor = "const order = orders.find(o => o.id === resolvedParams.id);";
  
  const sigMatch = code.match(/export default function \w+\(.*\) \{/);
  if (sigMatch) {
    let newVars = `
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState('');
  
  useEffect(() => {
    getOrderById(resolvedParams.id).then((res: any) => {
      if (res.success) {
        setFetchedOrder(res.order);
      } else {
        setOrderError(res.message);
      }
      setIsLoadingOrder(false);
    });
  }, [resolvedParams.id]);
`;
    if (!code.includes('useEffect')) {
      code = code.replace("import { use, useState } from 'react';", "import { use, useState, useEffect } from 'react';");
      code = code.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
    }

    const routerStr = "const router = useRouter();";
    if (code.includes(routerStr)) {
        code = code.replace(routerStr, routerStr + newVars);
    } else {
        const useDemoStr = "useDemo();";
        code = code.replace(useDemoStr, useDemoStr + newVars);
    }
  }

  // NOTE: omitting `: any` on `o` to preserve type inference.
  code = code.replace(searchFor, `
  const contextOrder = orders.find(o => o.id === resolvedParams.id);
  const order = contextOrder || fetchedOrder;
  
  if (isLoadingOrder && !order) return <div className="p-4 text-rio-muted">Cargando pedido...</div>;
  if (orderError && !order) return <div className="p-4 text-red-500">{orderError}</div>;
  `);

  fs.writeFileSync(filepath, code);
  console.log('Patched', filepath);
}

patchFile('src/app/admin/pedidos/[id]/page.tsx');
patchFile('src/app/admin/pedidos/[id]/imprimir/page.tsx');
patchFile('src/app/admin/pedidos/[id]/verificar/page.tsx');
