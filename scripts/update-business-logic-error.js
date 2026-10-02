const fs = require('fs');
let content = fs.readFileSync('src/app/actions/orders.ts', 'utf8');

// Update BusinessLogicError
content = content.replace(
`class BusinessLogicError extends Error {
  code: string;
  constructor(msg: string, code = 'BUSINESS_ERROR') {
    super(msg);
    this.name = 'BusinessLogicError';
    this.code = code;
  }
}`,
`class BusinessLogicError extends Error {
  code: string;
  conflicts?: any[];
  constructor(msg: string, code = 'BUSINESS_ERROR', conflicts?: any[]) {
    super(msg);
    this.name = 'BusinessLogicError';
    this.code = code;
    this.conflicts = conflicts;
  }
}`
);

// Update catch block
content = content.replace(
`    } catch (error: any) {
        console.error('Error creating order:', error);
        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code };
        }`,
`    } catch (error: any) {
        console.error('Error creating order:', error);
        if (error instanceof BusinessLogicError) {
           return { success: false, error: error.message, code: error.code, conflicts: error.conflicts };
        }`
);

fs.writeFileSync('src/app/actions/orders.ts', content);
