const fs = require('fs');
let content = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s+\/\/ Si cambia el carrito[\s\S]*?\}, \[cartItems\]\);/;
content = content.replace(regex, '');

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', content);
