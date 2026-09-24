const fs = require('fs');

let code = fs.readFileSync('src/app/admin/clientes/[id]/page.tsx', 'utf8');

if (!code.includes('EditCustomerModal')) {
  code = code.replace(
    "import { updateCustomerStatusAction } from '@/app/actions/clients';",
    "import { updateCustomerStatusAction } from '@/app/actions/clients';\nimport EditCustomerModal from '@/components/EditCustomerModal';\nimport { useState } from 'react';"
  );
}

// Add state
if (!code.includes('isEditModalOpen')) {
  code = code.replace(
    'const router = useRouter();',
    "const router = useRouter();\n  const [isEditModalOpen, setIsEditModalOpen] = useState(false);"
  );
}

// Add modal JSX before closing div of main container
code = code.replace(
  '    </div>\n  );\n}',
  `      {customer && <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={customer}
        onComplete={() => {
          setIsEditModalOpen(false);
          refreshData();
        }}
      />}
    </div>
  );
}`
);

// Wire the button
code = code.replace(
  /onClick=\{\(\) => addToast\('La interfaz de edición de datos está en construcción.'\)\}/g,
  'onClick={() => setIsEditModalOpen(true)}'
);

fs.writeFileSync('src/app/admin/clientes/[id]/page.tsx', code);
console.log('Client page updated to include EditCustomerModal');
