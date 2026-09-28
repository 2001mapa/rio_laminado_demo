const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

const oldMont = `const montserrat = Montserrat({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});`;

const newMont = `const montserrat = Montserrat({
  variable: "--font-serif",
  subsets: ["latin"],
});`;

if (code.includes(oldMont)) {
  code = code.replace(oldMont, newMont);
  fs.writeFileSync('src/app/layout.tsx', code);
  console.log('Fixed Montserrat font import');
} else {
  console.log('Not found');
}
