const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

// Imports
code = code.replace(/import \{ useDemo \} from '@\/lib\/DemoContext';/, `import { useDemo } from '@/lib/DemoContext';\nimport { useState } from 'react';`);

// State and handler
code = code.replace(/const \[trackingNumber, setTrackingNumber\] = useState\(''\);/, `const [trackingNumber, setTrackingNumber] = useState('');
  const [invoices, setInvoices] = useState<Record<string, string>>({});
  const { updateGroupInvoice } = useDemo();
  
  const handleSaveInvoice = async (groupId: string) => {
    const inv = invoices[groupId];
    if (!inv) return;
    const res = await updateGroupInvoice(groupId, inv);
    if (!res.success) alert(res.error);
    else window.dispatchEvent(new CustomEvent('rio:toast', { detail: { message: 'Factura registrada' } }));
  };`);

// Detalle de Referencias
const target1 = `            {/* Order Details */}
            <div className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border">
              <div className="flex justify-between items-center mb-5 border-b border-rio-border pb-4">`;
              
const index1 = code.indexOf(target1);
if (index1 !== -1) {
  // Find the end of this div block. It ends right before "          <div className=\"space-y-6\">"
  const targetEnd = `          <div className="space-y-6">
            {/* Customer Info */}`;
  const indexEnd = code.indexOf(targetEnd, index1);
  
  if (indexEnd !== -1) {
     const replacement = `            {/* Order Details */}
            {(() => {
              const groups = (order.groups && order.groups.length > 0)
                ? order.groups
                : [{ id: 'main', material: 'General', groupNumber: order.number, isVerified: true, items: [] as any[], externalInvoice: null }];
                
              return groups.map((group, groupIdx) => {
                const gItems = order.groups && order.groups.length > 0 
                  ? sortedItems.filter(i => i.materialGroupId === group.id)
                  : sortedItems;
                  
                return (
                  <div key={group.id} className="bg-rio-surface p-6 rounded-2xl shadow-sm border border-rio-border mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-rio-border pb-4 gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-rio-ink">{group.material}</h2>
                        <p className="text-sm text-rio-muted">Bolsa {groupIdx + 1} de {groups.length} - {group.groupNumber}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <span className="text-[10px] font-bold text-rio-ink bg-rio-surface-muted border border-rio-border px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {group.status || 'Pendiente'}
                        </span>
                        {group.id !== 'main' && (
                          <div className="flex items-center gap-2 mt-2 w-full md:w-auto">
                            <input 
                              type="text" 
                              placeholder="Nº Factura Externa" 
                              className="border border-rio-border rounded-lg px-3 py-1.5 text-sm w-full md:w-40 bg-rio-background text-rio-ink"
                              value={invoices[group.id] !== undefined ? invoices[group.id] : (group.externalInvoice || '')}
                              onChange={e => setInvoices({...invoices, [group.id]: e.target.value})}
                              disabled={!!group.externalInvoice}
                            />
                            {!group.externalInvoice && (
                              <button 
                                onClick={() => handleSaveInvoice(group.id)}
                                className="bg-rio-ink text-white px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap"
                              >Guardar</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {gItems.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) return null;
                        return (
                          <div key={item.id} className="flex gap-4 border-b border-rio-border/50 pb-4 last:border-0 last:pb-0">
                            <div className="w-16 h-16 rounded-xl bg-rio-surface-muted shrink-0 overflow-hidden border border-rio-border">
                              <img src={product.imageUrl || undefined} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1.5">
                                {product.locationCode ? (
                                  <span className="text-[10px] font-bold bg-rio-ink text-white px-2 py-0.5 rounded uppercase tracking-wider">
                                    UBIC: {product.locationCode}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-rio-danger/10 text-rio-danger border border-rio-danger/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                    SIN UBICACIÓN
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  {item.originalQuantity !== undefined && item.originalQuantity !== item.quantity && (
                                    <span className="text-[10px] line-through text-rio-muted">Cant: {item.originalQuantity}</span>
                                  )}
                                  <span className="text-sm font-bold text-rio-ink bg-rio-background px-2 py-0.5 rounded border border-rio-border">Cant: {item.quantity}</span>
                                  <button 
                                    onClick={() => {
                                      setAdjustingItem(item.id);
                                      setAdjustQuantity(item.quantity);
                                      setAdjustReason(item.adjustmentReason || 'Control de Calidad');
                                    }}
                                    className="p-1 text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted rounded-md transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPrintingSingle(item.id);
                                      setTimeout(() => {
                                        window.print();
                                        setTimeout(() => setPrintingSingle(null), 500);
                                      }, 100);
                                    }}
                                    className="p-1 text-rio-muted hover:text-rio-ink hover:bg-rio-surface-muted rounded-md transition-colors"
                                    title="Reimprimir sticker"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-mono font-bold text-rio-muted">{product.sku}</span>
                                {item.verified && !item.issue && (
                                  <span className="text-[10px] font-bold text-rio-success flex items-center bg-rio-success/10 border border-rio-success/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    <CheckSquare className="w-3 h-3 mr-1" /> Verificado
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-rio-ink leading-snug">{product.name}</p>
                              {item.issue && !item.adjustmentReason && (
                                <div className="mt-2 text-[11px] font-medium text-rio-danger bg-rio-danger/5 p-2 rounded-lg border border-rio-danger/20 flex items-start">
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                                  <span>{item.issue}</span>
                                </div>
                              )}
                              {item.adjustmentReason && (
                                <div className="mt-2 text-[11px] font-medium text-rio-warning bg-rio-warning/5 p-2 rounded-lg border border-rio-warning/20 flex items-start">
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" />
                                  <span>Ajustado: {item.adjustmentReason} (Original: {item.originalQuantity})</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <div className="space-y-6">
            {/* Customer Info */}`;
            
     // replace
     code = code.substring(0, index1) + replacement + code.substring(indexEnd + targetEnd.length);
  }
}

// Print block
const pbRegex = /\{\(\(\) => \{\s*const itemsToPrint = sortedItems\.filter\(item => printingSingle \? item\.id === printingSingle : true\);[\s\S]*?return \([\s\S]*?\}\)\(\)\}/;

const pbReplacement = `{(() => {
          const itemsToPrint = sortedItems.filter(item => printingSingle ? item.id === printingSingle : true);
          
          let elements = [];
          
          if (order.groups && order.groups.length > 0 && !printingSingle) {
             order.groups.forEach(g => {
                const gItems = itemsToPrint.filter(i => i.materialGroupId === g.id);
                gItems.forEach((item, index) => {
                   const product = products.find(p => p.id === item.productId);
                   elements.push({ type: 'item', item, index, product });
                });
                elements.push({ type: 'marker', text: \`Fin de \${g.material}\` });
             });
          } else {
             itemsToPrint.forEach((item, index) => {
                const product = products.find(p => p.id === item.productId);
                elements.push({ type: 'item', item, index, product });
             });
          }
          
          return (
            <div>
              <div 
                className="grid grid-cols-3"
                style={{ paddingLeft: \`\${offsetX}mm\`, paddingTop: \`\${offsetY}mm\`, rowGap: \`\${gapY}mm\`, columnGap: \`\${gapX}mm\` }}
              >
                {elements.map((el, i) => {
                  if (el.type === 'marker') {
                    return (
                      <div key={\`marker-\${i}\`} className="w-[32mm] h-[16mm] break-inside-avoid flex items-center justify-center text-black border-2 border-black border-dashed p-[1mm]">
                        <span className="font-bold text-xs uppercase text-center">{el.text}</span>
                      </div>
                    );
                  }
                  
                  const { item, index, product } = el;
                  return (
                    <div 
                      key={item.id} 
                      className="w-[32mm] h-[16mm] break-inside-avoid flex flex-col items-center justify-between text-black overflow-hidden p-[1mm]"
                    >
                      {/* Fila superior de texto */}
                      <div className="w-full flex justify-between items-center leading-none mb-[1.5mm]">
                        <span className="font-bold text-[9px]">#{index + 1}</span>
                        <span className="font-black text-[10px] tracking-tighter truncate mx-1">{product?.sku}</span>
                        <span className="font-bold text-[9px]">C:{item.quantity}</span>
                      </div>
                      
                      {/* Código de barras 1D */}
                      <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                        {product?.sku ? (
                          <img 
                            src={\`https://bwipjs-api.metafloor.com/?bcid=code128&text=\${encodeURIComponent(product.sku)}&scaleX=2&scaleY=1&includetext=false\`}
                            alt={product.sku}
                            className="w-full h-full object-contain mix-blend-multiply"
                            loading="eager"
                          />
                        ) : (
                          <span className="text-[8px] text-gray-400">Sin SKU</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}`;
        
code = code.replace(pbRegex, pbReplacement);

fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
console.log('Done replacement');
