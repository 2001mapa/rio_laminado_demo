const fs = require('fs');
let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const regexSku = /<div className="text-\[11px\] font-mono font-medium text-rio-muted flex items-center gap-2">\s*\{product\.sku\}\s*\{!product\.isActive && \(/;
if (code.match(regexSku)) {
  code = code.replace(regexSku, `<div className="text-[11px] font-mono font-medium text-rio-muted flex items-center gap-2">
                          {product.sku}
                          <span className="text-rio-muted/50 px-1">•</span>
                          {product.locationCode ? (
                            <span className={\`inline-flex items-center gap-1 px-1.5 py-0.5 rounded \${duplicateLocationCodes.includes(product.locationCode) ? 'bg-rio-danger/10 text-rio-danger font-bold border border-rio-danger/20' : 'bg-rio-surface-muted border border-rio-border/50'}\`}>
                              {duplicateLocationCodes.includes(product.locationCode) && <AlertTriangle className="w-3 h-3" />}
                              Ubicación: {product.locationCode}
                            </span>
                          ) : (
                            <span className="italic text-rio-muted/70">Sin ubicación</span>
                          )}
                          {!product.isActive && (`);
  fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
  console.log('Modified SKU div to include location');
} else {
  console.log('Failed to match SKU div');
}
