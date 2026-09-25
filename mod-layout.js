const fs = require('fs');
let code = fs.readFileSync('src/app/vendedor/layout.tsx', 'utf8');

const regex = /<div className="flex justify-end md:w-1\/3 items-center gap-2">[\s\S]*?<button\s+onClick=\{handleLogout\}[\s\S]*?<\/button>\s*<\/div>/;
const replacement = `<div className="flex justify-end md:w-1/3 items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 text-rio-muted hover:text-rio-ink transition-colors flex items-center rounded-xl hover:bg-rio-surface-muted"
            title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
        </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/vendedor/layout.tsx', code);
console.log('Removed logout from layout');
