const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');
if (!code.includes("import ProductModal")) {
  code = code.replace(
    "import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';",
    "import { ProductCardSkeleton, WelcomeBannerSkeleton } from '@/components/Skeletons';\nimport ProductModal from '@/components/ProductModal';"
  );
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log('Imported ProductModal');
}
