const fs = require('fs');
let c = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

// Inside handleFileChange
c = c.replace(
  /const previewResponse = await previewCSVUpload\(mappedItems\);/g,
  `const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const previewResponse = await previewCSVUpload(mappedItems, session?.access_token);`
);

// Inside handleConfirmUpload
c = c.replace(
  /const response = await bulkUploadInventory\(parsedItems\);/g,
  `const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const response = await bulkUploadInventory(parsedItems, session?.access_token);`
);

fs.writeFileSync('src/components/CSVImporter.tsx', c);
