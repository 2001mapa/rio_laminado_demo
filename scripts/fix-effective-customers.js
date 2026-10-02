const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

content = content.replace(
`  useEffect(() => {
    if (effectiveCustomers.length === 0) {
      searchOfflineCustomers('').then(res => setOfflineCustomers(res as any));
    }
  }, [customers]);
  const effectiveCustomers = effectiveCustomers.length > 0 ? customers : offlineCustomers;`,
`  const effectiveCustomers = customers.length > 0 ? customers : offlineCustomers;
  useEffect(() => {
    if (customers.length === 0) {
      searchOfflineCustomers('').then(res => setOfflineCustomers(res as any));
    }
  }, [customers]);`
);

content = content.replace(
`const cust = effectiveCustomers.find(c => c.id === offlineDraftWaiting.clientId);`,
`const cust = effectiveCustomers.find((c: any) => c.id === offlineDraftWaiting.clientId);`
);

content = content.replace(
`const cust = effectiveCustomers.find(c => c.id === order.customerId);`,
`const cust = effectiveCustomers.find((c: any) => c.id === order.customerId);`
);

content = content.replace(
`const filteredCustomers = effectiveCustomers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );`,
`const filteredCustomers = effectiveCustomers.filter((c: any) => 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
