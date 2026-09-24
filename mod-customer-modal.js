const fs = require('fs');

let code = fs.readFileSync('src/components/CreateCustomerModal.tsx', 'utf8');

// 1. Remove RIO2024 defaultValue
code = code.replace(
  'defaultValue="RIO2024"',
  'defaultValue={Math.random().toString(36).slice(-8).toUpperCase()}'
);

// 2. Add temporaryPassword to successData
const successDataRegex = /setSuccessData\(\{\s*\.\.\.res\.customer,\s*username: customerData\.username,\s*\}\);/;
const successDataReplacement = `setSuccessData({
            ...res.customer,
            username: customerData.username,
            temporaryPassword: customerData.temporaryPassword,
          });`;
code = code.replace(successDataRegex, successDataReplacement);

// 3. Remove addCustomer call
const addCustomerRegex = /addCustomer\(\{[\s\S]*?\}\);/;
code = code.replace(addCustomerRegex, `// Just call refreshData from useDemo
          const { refreshData } = require('@/lib/DemoContext').useDemo;
          // Wait, I can't call hooks conditionally or dynamically like this.
          // Let's rely on the onComplete callback which calls refreshData().
          `);

// 4. Update the copy string
const copyRegex = /Contrase\a temporal: RIO2024/;
code = code.replace(copyRegex, 'Contraseña temporal: ${successData.temporaryPassword}');
// Also replace the \n escaping because it's in backticks
code = code.replace(/\\n\\nY"- Ingresa aqu: \$\{inviteUrl\}\\nY' Usuario: \$\{successData\.username\}\\nY"' Contrasea temporal: RIO2024/, 
  '\\n\\n🔗 Ingresa aquí: ${inviteUrl}\\n👤 Usuario: ${successData.username}\\n🔑 Contraseña temporal: ${successData.temporaryPassword}'
);

fs.writeFileSync('src/components/CreateCustomerModal.tsx', code);
console.log('CreateCustomerModal updated');
