const fs = require('fs');
let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

const importRegex = /import \{ createOrder as createOrderAction, transitionOrder as transitionOrderAction, acknowledgeOrderAdjustment as acknowledgeAdjustmentAction \} from '@\/app\/actions\/orders';/;
const newImport = `import { createOrder as createOrderAction, transitionOrder as transitionOrderAction, acknowledgeOrderAdjustment as acknowledgeAdjustmentAction, updateMaterialGroupInvoice as updateMaterialGroupInvoiceAction } from '@/app/actions/orders';`;

code = code.replace(importRegex, newImport);

const typeRegex = /addSeller: \(seller: Seller\) => void;\n\s+checkoutSeller: /;
const newType = `addSeller: (seller: Seller) => void;
    updateGroupInvoice: (groupId: string, invoice: string) => Promise<any>;
    checkoutSeller: `;

code = code.replace(typeRegex, newType);

const implRegex = /const checkoutSeller = async /;
const newImpl = `const updateGroupInvoice = async (groupId: string, invoice: string) => {
      try {
        const result = await updateMaterialGroupInvoiceAction(groupId, invoice);
        if (result.success) {
           await refreshData();
        }
        return result;
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    };
    
    const checkoutSeller = async `;

code = code.replace(implRegex, newImpl);

const provideRegex = /updateCustomer,\n\s+addCustomer,\n\s+addSeller,\n\s+resetDemoData,/;
const newProvide = `updateCustomer,
        addCustomer,
        addSeller,
        updateGroupInvoice,
        resetDemoData,`;

code = code.replace(provideRegex, newProvide);

fs.writeFileSync('src/lib/DemoContext.tsx', code);
console.log('DemoContext updated');
