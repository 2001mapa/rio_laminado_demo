const fs = require('fs');

const genSecureCode = `
const generateSecurePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const array = new Uint32Array(10);
  window.crypto.getRandomValues(array);
  let pass = '';
  for (let i = 0; i < 10; i++) { pass += chars[array[i] % chars.length]; }
  return pass + 'A1a*';
};
`;

function fixComponent(path) {
  let code = fs.readFileSync(path, 'utf8');
  
  if (!code.includes('generateSecurePassword')) {
    // Insert function at the top of the file after imports
    code = code.replace(/import.*?['"];?\n/g, match => match);
    const lastImport = code.lastIndexOf('import');
    const importEnd = code.indexOf('\n', lastImport) + 1;
    code = code.slice(0, importEnd) + genSecureCode + code.slice(importEnd);
  }
  
  // Replace Math.random inside useState
  code = code.replace(/useState\(\(\) => Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\)\)/g, 'useState(() => generateSecurePassword())');
  
  // Replace generatePassword body
  code = code.replace(/setPassword\(Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\) \+ Math\.floor\(Math\.random\(\) \* 10\)\);/g, 'setPassword(generateSecurePassword());');
  code = code.replace(/setNewPassword\(Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\) \+ Math\.floor\(Math\.random\(\) \* 10\)\);/g, 'setNewPassword(generateSecurePassword());');

  fs.writeFileSync(path, code);
}

fixComponent('src/components/CreateCustomerModal.tsx');
fixComponent('src/components/ResetPasswordModal.tsx');

// Server files
const isStrongCode = `
function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}
`;

function fixServerClients() {
  let code = fs.readFileSync('src/app/actions/clients.ts', 'utf8');
  
  if (!code.includes('isStrongPassword')) {
    code = code.replace(/'use server'/, "'use server'\n" + isStrongCode);
  }
  
  // createCustomer check
  code = code.replace(
    /if \(data\.username && data\.temporaryPassword\) \{/,
    `if (data.temporaryPassword && !isStrongPassword(data.temporaryPassword)) {
      return { success: false, message: 'La contraseña no es segura.' };
    }
    if (data.username && data.temporaryPassword) {`
  );
  
  // resetCustomer check
  code = code.replace(
    /if \(newPassword\.length < 6\) \{[\s\S]*?\}/,
    `if (!isStrongPassword(newPassword)) {
    return { success: false, message: 'La contraseña no es segura.' };
  }`
  );
  fs.writeFileSync('src/app/actions/clients.ts', code);
}
fixServerClients();

function fixServerSellers() {
  let code = fs.readFileSync('src/app/actions/sellers.ts', 'utf8');
  if (!code.includes('import crypto')) {
    code = code.replace(/'use server'/, "'use server'\nimport crypto from 'crypto';\n");
  }
  code = code.replace(
    /const tempPassword = `Vendedor-\$\{Math\.random\(\)\.toString\(36\)\.substring\(2, 8\)\.toUpperCase\(\)\}\*`;/,
    `const tempPassword = 'V-' + crypto.randomBytes(6).toString('hex').toUpperCase() + '*Ab1';`
  );
  fs.writeFileSync('src/app/actions/sellers.ts', code);
}
fixServerSellers();
