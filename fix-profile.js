const fs = require('fs');
let c = fs.readFileSync('src/app/admin/clientes/[id]/page.tsx', 'utf8');

c = c.replace(
  "import { updateCustomerStatusAction } from '@/app/actions/clients';",
  "import { updateCustomerStatusAction, getCustomerProfile } from '@/app/actions/clients';"
);

c = c.replace(
  "import { use } from 'react';",
  "import { use, useEffect } from 'react';"
);

const hooksInject = `  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    getCustomerProfile(resolvedParams.id).then(res => {
      if (res.success) {
        setCustomerOrders(res.orders);
      }
      setIsLoadingOrders(false);
    });
  }, [resolvedParams.id]);`;

c = c.replace(
  "  const [isResetModalOpen, setIsResetModalOpen] = useState(false);",
  hooksInject
);

c = c.replace(
  /  let customerOrders = \[\];\r?\n  customerOrders = orders\.filter[^\n]+\n/,
  ""
);

fs.writeFileSync('src/app/admin/clientes/[id]/page.tsx', c);
console.log('Fixed profile');
