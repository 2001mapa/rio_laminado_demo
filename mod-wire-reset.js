const fs = require('fs');

let code = fs.readFileSync('src/app/admin/clientes/[id]/page.tsx', 'utf8');

// Ensure we import the new modal
if (!code.includes('ResetPasswordModal')) {
  code = code.replace(
    "import EditCustomerModal from '@/components/EditCustomerModal';",
    "import EditCustomerModal from '@/components/EditCustomerModal';\nimport ResetPasswordModal from '@/components/ResetPasswordModal';"
  );
}

// Add state for Reset Modal
if (!code.includes('isResetModalOpen')) {
  code = code.replace(
    'const [isEditModalOpen, setIsEditModalOpen] = useState(false);',
    'const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n  const [isResetModalOpen, setIsResetModalOpen] = useState(false);'
  );
}

// Wire the button
code = code.replace(
  /onClick=\{\(\) => addToast\('El restablecimiento de credenciales requiere configuración de Supabase Auth.'\)\}/g,
  'onClick={() => setIsResetModalOpen(true)}'
);

// Add modal JSX before closing div
const modalJSX = `
      {customer && <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        customer={customer}
      />}
`;

if (!code.includes('<ResetPasswordModal')) {
  code = code.replace(
    '    </div>\n  );\n}',
    modalJSX + '    </div>\n  );\n}'
  );
}

fs.writeFileSync('src/app/admin/clientes/[id]/page.tsx', code);
console.log('Wired ResetPasswordModal');
