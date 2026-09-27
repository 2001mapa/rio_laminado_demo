const fs = require('fs');

let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

code = code.replace(
  /import \{ useState \} from 'react';/,
  `import { useState, useEffect } from 'react';`
);

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('Fixed imports');
