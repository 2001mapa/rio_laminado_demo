const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const target = `{skuSuggestions.length > 0 && manualSku.trim().length > 0 && !scannedProduct && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-rio-border z-[100] max-h-60 overflow-y-auto animate-fade-in">`;

const replacement = `{(isSearchingSku || skuSuggestions.length > 0) && manualSku.trim().length > 0 && !scannedProduct && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-rio-border z-[100] max-h-60 overflow-y-auto animate-fade-in">
                      {isSearchingSku && skuSuggestions.length === 0 && (
                        <div className="p-4 text-center text-sm text-rio-muted font-medium">
                          Buscando referencias...
                        </div>
                      )}
                      {!isSearchingSku && skuSuggestions.length === 0 && manualSku.trim().length > 2 && (
                        <div className="p-4 text-center text-sm text-rio-muted font-medium">
                          No se encontraron coincidencias
                        </div>
                      )}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
  console.log('Added loading and empty states to autocomplete dropdown');
} else {
  console.log('Target not found');
}
