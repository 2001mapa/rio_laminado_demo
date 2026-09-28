const fs = require('fs');
let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

code = code.replace("warnings: previewResponse.warnings || [],", "warnings: (previewResponse as any).warnings || [],");

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('Fixed TS error in CSVImporter');
