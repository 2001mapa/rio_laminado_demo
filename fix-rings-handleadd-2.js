const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const startIdx = code.indexOf('const handleAdd = () => {\\r\\n    const stockDisponible');
if (startIdx !== -1) {
    code = code.replace('const handleAdd = () => {\\r\\n    const stockDisponible', 
`const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible`);
    console.log('Fixed CRLF');
} else {
    const startIdx2 = code.indexOf('const handleAdd = () => {\\n    const stockDisponible');
    if (startIdx2 !== -1) {
        code = code.replace('const handleAdd = () => {\\n    const stockDisponible', 
`const handleAdd = () => {
    if (product.category === 'Anillos') {
       onExpand();
       return;
    }
    const stockDisponible`);
        console.log('Fixed LF');
    } else {
        console.log('Could not find it');
    }
}

fs.writeFileSync('src/app/cliente/page.tsx', code);
