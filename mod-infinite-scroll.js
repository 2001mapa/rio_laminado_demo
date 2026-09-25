const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

// Fix material button
code = code.replace(
  /onClick=\{\(\) => \{ setActiveMaterial\(mat\); setActiveCategory\('Todos'\); \}\}/g,
  `onClick={() => { setActiveMaterial(mat); }}`
);

// Fix category rendering map
code = code.replace(
  /\(effectiveCategory === 'Todos' \? categories\.slice\(1\) : \[effectiveCategory\]\)\.map/g,
  `categories.slice(1).map`
);

fs.writeFileSync('src/app/cliente/page.tsx', code);
console.log("Updated client page infinite scroll behavior");
