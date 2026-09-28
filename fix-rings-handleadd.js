const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const target1 = "const handleAdd = () => {\\r\\n    const stockDisponible";
const target2 = "const handleAdd = () => {\\n    const stockDisponible";
const target3 = "const handleAdd = () => {\\r\\n      const stockDisponible";
const target4 = "const handleAdd = () => {\\n      const stockDisponible";

const newStr = \`const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible\`;

if (code.includes("const handleAdd = () => {\\r\\n    const stockDisponible")) {
    code = code.replace("const handleAdd = () => {\\r\\n    const stockDisponible", newStr);
    console.log('Fixed \\r\\n');
} else if (code.includes("const handleAdd = () => {\\n    const stockDisponible")) {
    code = code.replace("const handleAdd = () => {\\n    const stockDisponible", newStr);
    console.log('Fixed \\n');
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
