const fs = require('fs');

const validationFn = `
function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}
`;

// 1. clients.ts
let clients = fs.readFileSync('src/app/actions/clients.ts', 'utf8');

if (!clients.includes('isStrongPassword')) {
  clients = clients.replace(/(import .*?\n)+/, '$&\n' + validationFn);
}

// Add validation to createCustomer
clients = clients.replace(
  /if \(data\.username && data\.temporaryPassword\) \{/,
  `if (data.temporaryPassword && !isStrongPassword(data.temporaryPassword)) {
      return { success: false, message: 'La contraseña proporcionada no es segura. Debe tener al menos 8 caracteres, mayúsculas, minúsculas y números.' };
    }
    if (data.username && data.temporaryPassword) {`
);

// Add validation to resetCustomerPasswordAction
clients = clients.replace(
  /if \(newPassword\.length < 6\) \{[\s\S]*?\}/,
  `if (!isStrongPassword(newPassword)) {
    return { success: false, message: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.' };
  }`
);

fs.writeFileSync('src/app/actions/clients.ts', clients);


// 2. sellers.ts
let sellers = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');

if (!sellers.includes('crypto.randomBytes')) {
  sellers = sellers.replace(/(import .*?\n)+/, '$&\nimport crypto from "crypto";\n');
}

sellers = sellers.replace(
  /const tempPassword = `Vendedor-\$\{Math\.random\(\)\.toString\(36\)\.substring\(2, 8\)\.toUpperCase\(\)\}\*`;/,
  `const tempPassword = 'V-' + crypto.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';`
);

fs.writeFileSync('src/app/actions/sellers.ts', sellers);
console.log('Fixed server actions validation and crypto');
