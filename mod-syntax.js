const fs = require('fs');
let code = fs.readFileSync('src/app/actions/clients.ts', 'utf8');
code = code.replace(
  /if \(\!isStrongPassword\(newPassword\)\) \{\s*return \{ success: false, message: 'La contraseña no es segura\.' \};\s*\};\s*\}/,
  `if (!isStrongPassword(newPassword)) {
    return { success: false, message: 'La contraseña no es segura.' };
  }`
);
fs.writeFileSync('src/app/actions/clients.ts', code);
