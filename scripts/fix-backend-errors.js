const fs = require('fs');

let c = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

const classInjection = `
export class BusinessLogicError extends Error {
  code: string;
  constructor(message: string, code = 'BUSINESS_ERROR') {
    super(message);
    this.name = 'BusinessLogicError';
    this.code = code;
  }
}
`;

// Inject class at the top after imports
c = c.replace(/(import [^\n]+;\n)+/, (match) => match + '\n' + classInjection);

// Replace all `throw new Error(` or `throw new Error('` with `throw new BusinessLogicError(`
c = c.replace(/throw new Error\(/g, 'throw new BusinessLogicError(');

// Update catch block
const newCatch = `
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error instanceof BusinessLogicError) {
         return { success: false, error: error.message, code: error.code };
      }
      return { 
        success: false, 
        error: error.message,
        code: 'NETWORK_OR_DB_ERROR'
      };
    }
`;
c = c.replace(/catch \(error: any\) \{[\s\S]*?code: isPrismaOrNetwork \? 'NETWORK_OR_DB_ERROR' : 'BUSINESS_ERROR'[\s\S]*?\}\s*\}/m, newCatch.trim());
c = c.replace(/catch \(error: any\) \{\s*return \{ success: false, error: error\.message \};\s*\}/g, newCatch.trim());

fs.writeFileSync('src/app/actions/orders.ts', c);
