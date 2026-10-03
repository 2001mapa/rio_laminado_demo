const fs = require('fs');
let page = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex1 = /const \[offlineDraftWaiting, setOfflineDraftWaiting\] = useState<\{cart: any\[\], clientId\?: string\} \| null>\(null\);/;
page = page.replace(regex1, `const [offlineDraftWaiting, setOfflineDraftWaiting] = useState<{cart: any[], clientId?: string, newCustomerData?: any} | null>(null);`);

const regex2 = /if \(draft && draft\.cart && draft\.cart\.length > 0\) \{\s*setOfflineDraftWaiting\(\{ cart: draft\.cart, clientId: draft\.selectedClientId \}\);/;
page = page.replace(regex2, `if (draft && ((draft.cart && draft.cart.length > 0) || draft.newCustomerData)) {
                       setOfflineDraftWaiting({ cart: draft.cart || [], clientId: draft.selectedClientId, newCustomerData: draft.newCustomerData });`);

const regex3 = /if \(allResolved && clientResolved\) \{\s*if \(restoredCart\.length > 0\) \{\s*setCartItems\(restoredCart as any\[\]\);\s*\}\s*if \(offlineDraftWaiting\.clientId\) \{\s*const cust = effectiveCustomers\.find\(c => c\.id === offlineDraftWaiting\.clientId\);\s*if \(cust\) \{\s*setSelectedCustomer\(cust \|\| null\);\s*setStep\(2\);\s*\}\s*\}\s*setOfflineDraftWaiting\(null\);\s*setIsDraftLoaded\(true\);\s*\}/;
page = page.replace(regex3, `if (allResolved && clientResolved) {
                    if (restoredCart.length > 0) {
                        setCartItems(restoredCart as any[]);
                    }
                    if (offlineDraftWaiting.clientId) {
                       const cust = effectiveCustomers.find(c => c.id === offlineDraftWaiting.clientId);
                       if (cust) {
                           setSelectedCustomer(cust || null);
                           setStep(2);
                       }
                    } else if (offlineDraftWaiting.newCustomerData) {
                       setNewCustomerData(offlineDraftWaiting.newCustomerData);
                       setStep(2);
                    }
                    setOfflineDraftWaiting(null);
                    setIsDraftLoaded(true);
                }`);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', page);
