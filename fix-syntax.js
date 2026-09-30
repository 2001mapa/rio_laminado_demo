const fs = require('fs');
let c = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

c = c.replace(
  "import { Activity, ArrowLeft, CheckSquare, Printer, ClipboardCheck, PackageCheck, AlertTriangle, Edit2, X, Settings, ChevronDown } from 'lucide-react';",
  "import { Activity, ArrowLeft, CheckSquare, Printer, ClipboardCheck, PackageCheck, AlertTriangle, Edit2, X, Settings, ChevronDown, Loader2 } from 'lucide-react';"
);

const hooksInject = `  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState('');
  
  const [offsetX, setOffsetX] = useState<number>(3.2);
  const [offsetY, setOffsetY] = useState<number>(1.6);
  const [gapY, setGapY] = useState<number>(3.0);
  const [gapX, setGapX] = useState<number>(3.0);`;

c = c.replace(
  "  const [fetchedOrder, setFetchedOrder] = useState<any>(null);\n  const [isLoadingOrder, setIsLoadingOrder] = useState(true);\n  const [orderError, setOrderError] = useState('');",
  hooksInject
);

c = c.replace(
  "  const [fetchedOrder, setFetchedOrder] = useState<any>(null);\r\n  const [isLoadingOrder, setIsLoadingOrder] = useState(true);\r\n  const [orderError, setOrderError] = useState('');",
  hooksInject
);

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', c);
console.log("Fixed!");
