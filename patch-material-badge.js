const fs = require('fs');

let code = fs.readFileSync('src/app/admin/inventario/page.tsx', 'utf8');

const targetMaterial = `<td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium hidden md:table-cell">
                    <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${product.material === 'Por revisar' ? 'bg-rio-danger/10 text-rio-danger border border-rio-danger/20' : 'bg-rio-surface-muted text-rio-ink border border-rio-border'}\`}>
                      {product.material || 'Por revisar'}
                    </span>
                  </td>`;

const replaceMaterial = `<td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium hidden md:table-cell">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider \${product.material === 'Por revisar' ? 'bg-rio-danger/10 text-rio-danger border border-rio-danger/20' : 'bg-rio-surface-muted text-rio-ink border border-rio-border'}\`}>
                        {product.material || 'Por revisar'}
                      </span>
                      {activeMaterial === 'Por revisar' && (
                        <>
                           {!product.imageUrl && <span className="text-[9px] text-rio-danger font-medium">Falta Foto</span>}
                           {!product.locationCode && <span className="text-[9px] text-rio-danger font-medium">Falta Ubic.</span>}
                           {product.locationCode && duplicateLocationCodes.includes(product.locationCode) && <span className="text-[9px] text-rio-danger font-medium">Ubic. Duplicada</span>}
                        </>
                      )}
                    </div>
                  </td>`;

code = code.replace(targetMaterial, replaceMaterial);
fs.writeFileSync('src/app/admin/inventario/page.tsx', code);
console.log('Fixed material badge');
