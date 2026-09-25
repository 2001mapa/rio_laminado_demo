const fs = require('fs');

function replaceInFile(path, regex, replacement) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(regex, replacement);
  fs.writeFileSync(path, code);
}

// 1. CreateCustomerModal.tsx
let createCustomer = fs.readFileSync('src/components/CreateCustomerModal.tsx', 'utf8');

const secureGenClient = `
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const array = new Uint32Array(10);
    window.crypto.getRandomValues(array);
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars[array[i] % chars.length];
    }
    // Ensure at least one number, one upper, one lower (simple way: just append them if missing, but our random might hit them. For simplicity just append a known sequence if we really need to, or rely on the length. Actually just ensuring strength:)
    return pass + 'A1a*';
  };
`;

if (!createCustomer.includes('generateSecurePassword')) {
  createCustomer = createCustomer.replace(/export default function CreateCustomerModal[^{]*\{/, `export default function CreateCustomerModal({ isOpen, onClose }: CreateCustomerModalProps) {\n${secureGenClient}`);
  
  createCustomer = createCustomer.replace(
    /const \[password, setPassword\] = useState\(\(\) => Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\)\);/g,
    'const [password, setPassword] = useState(() => generateSecurePassword());'
  );

  createCustomer = createCustomer.replace(
    /const generatePassword = \(\) => \{\s*setPassword\(Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\) \+ Math\.floor\(Math\.random\(\) \* 10\)\);\s*\};/g,
    'const generatePassword = () => { setPassword(generateSecurePassword()); };'
  );
  
  fs.writeFileSync('src/components/CreateCustomerModal.tsx', createCustomer);
}

// 2. ResetPasswordModal.tsx
let resetPassword = fs.readFileSync('src/components/ResetPasswordModal.tsx', 'utf8');
if (!resetPassword.includes('generateSecurePassword')) {
  resetPassword = resetPassword.replace(/export default function ResetPasswordModal[^{]*\{/, `export default function ResetPasswordModal({ isOpen, onClose, customer, onResetSuccess }: ResetPasswordModalProps) {\n${secureGenClient}`);
  
  resetPassword = resetPassword.replace(
    /const \[newPassword, setNewPassword\] = useState\(\(\) => Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\)\);/g,
    'const [newPassword, setNewPassword] = useState(() => generateSecurePassword());'
  );

  resetPassword = resetPassword.replace(
    /const generatePassword = \(\) => \{\s*setNewPassword\(Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\) \+ Math\.floor\(Math\.random\(\) \* 10\)\);\s*\};/g,
    'const generatePassword = () => { setNewPassword(generateSecurePassword()); };'
  );
  
  fs.writeFileSync('src/components/ResetPasswordModal.tsx', resetPassword);
}

console.log('Fixed client side password generation');
