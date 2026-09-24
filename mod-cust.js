const fs = require('fs');

let code = fs.readFileSync('src/components/CreateCustomerModal.tsx', 'utf8');

// 1. Update defaultValue
code = code.replace(/defaultValue="RIO2024"/g, 'defaultValue={Math.random().toString(36).slice(-8).toUpperCase()}');

// 2. Update successData state
code = code.replace(
  /setSuccessData\(\{\s*\.\.\.res\.customer,\s*username: customerData\.username,\s*\}\);/,
  `setSuccessData({
            ...res.customer,
            username: customerData.username,
            temporaryPassword: customerData.temporaryPassword,
          });`
);

// 3. Remove addCustomer call
code = code.replace(
  /addCustomer\(\{[\s\S]*?\}\);/,
  `// Removed duplicate optimistic update since we're using refreshData/onComplete.`
);

// 4. Update copy text
code = code.replace(
  /Contrase.*? temporal: RIO2024/g,
  'Contraseña temporal: ${successData.temporaryPassword}'
);
code = code.replace(
  /Contrase.*?: <span className="font-mono text-rio-gold-dark font-bold">RIO2024<\/span>/g,
  'Contraseña temporal: <span className="font-mono text-rio-gold-dark font-bold">{successData.temporaryPassword}</span>'
);

fs.writeFileSync('src/components/CreateCustomerModal.tsx', code);
console.log('Customer modal updated successfully.');
