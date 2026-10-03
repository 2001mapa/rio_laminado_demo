const fs = require('fs');
let page = fs.readFileSync('src/app/admin/clientes/page.tsx', 'utf8');

const regex = /<div className="flex flex-col md:flex-row gap-4 items-center">\s*<div className="relative w-full md:w-96">\s*<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">\s*<Search className="h-4 w-4 text-rio-muted" \/>\s*<\/div>\s*<div className="relative w-full md:w-96">\s*<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">\s*<Search className="h-4 w-4 text-rio-muted" \/>\s*<\/div>/m;

const replacement = `<div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-rio-muted" />
          </div>`;

page = page.replace(regex, replacement);

fs.writeFileSync('src/app/admin/clientes/page.tsx', page);
