const fs = require('fs');
let page = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

// Add states
page = page.replace(
  `const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);`,
  `const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);\n  const [newCustomerData, setNewCustomerData] = useState<{name: string, phone: string, city: string, address: string, email?: string} | null>(null);\n  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);`
);

// Load draft: restore newCustomerData
page = page.replace(
  `if (draft.selectedClientId) {`,
  `if (draft.newCustomerData) {
                       setNewCustomerData(draft.newCustomerData);
                       setStep(2);
                   } else if (draft.selectedClientId) {`
);

// clearDraft / reset form
page = page.replace(
  `setSelectedCustomer(null);\n        addToast("Borrador guardado localmente.");`,
  `setSelectedCustomer(null);\n        setNewCustomerData(null);\n        setIsCreatingNewCustomer(false);\n        addToast("Borrador guardado localmente.");`
);

// In saveDraft:
page = page.replace(
  `             selectedClientId: selectedCustomer?.id,`,
  `             selectedClientId: selectedCustomer?.id,\n             newCustomerData: newCustomerData || undefined,`
);

// In addPendingOrder:
page = page.replace(
  `        customerId: selectedCustomer.id,\n        customerName: selectedCustomer.name,`,
  `        customerId: selectedCustomer ? selectedCustomer.id : 'NEW_CUSTOMER',\n        customerName: selectedCustomer ? selectedCustomer.name : (newCustomerData?.name || 'Cliente Nuevo'),\n        newCustomerData: newCustomerData || undefined,`
);

// Dependency arrays for saveDraft useEffect
page = page.replace(
  `[cartItems, selectedCustomer, sellerId, isDraftLoaded, offlineDraftWaiting]`,
  `[cartItems, selectedCustomer, newCustomerData, sellerId, isDraftLoaded, offlineDraftWaiting]`
);

// Conditions for saving draft
page = page.replace(
  `if (cartItems.length > 0 || selectedCustomer) {`,
  `if (cartItems.length > 0 || selectedCustomer || newCustomerData) {`
);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', page);
