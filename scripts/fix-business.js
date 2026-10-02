const fs = require('fs');
let c = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

if (!c.includes('export class BusinessLogicError')) {
    c = c.replace(/'use server';/, "'use server';\n\nexport class BusinessLogicError extends Error {\n  code: string;\n  constructor(msg: string, code = 'BUSINESS_ERROR') {\n    super(msg);\n    this.name = 'BusinessLogicError';\n    this.code = code;\n  }\n}\n");
    fs.writeFileSync('src/app/actions/orders.ts', c);
}
