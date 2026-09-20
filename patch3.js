const fs = require('fs');
let c = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');

if (!c.includes("const { createClient } = await import('@/utils/supabase/client')")) {
  c = c.replace(/const createRes = await createSingleProduct\(productData\);/g, 
  `const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const createRes = await createSingleProduct(productData, session?.access_token);`);
  fs.writeFileSync('src/components/CreateProductModal.tsx', c);
}
