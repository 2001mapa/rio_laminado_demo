const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

if (!code.includes('adjustSizes')) {
  // Add state
  code = code.replace(
    /const \[adjustQuantity, setAdjustQuantity\] = useState<number>\(0\);/,
    `const [adjustQuantity, setAdjustQuantity] = useState<number>(0);\n  const [adjustSizes, setAdjustSizes] = useState<{size: string, quantity: number}[]>([]);`
  );

  // Add click handler
  code = code.replace(
    /setAdjustingItem\(item\.id\);\s*setAdjustQuantity\(item\.quantity\);\s*setAdjustReason\(item\.adjustmentReason \|\| 'Control de Calidad'\);/g,
    `setAdjustingItem(item.id);
                                      setAdjustQuantity(item.quantity);
                                      setAdjustSizes(item.sizeDetails || []);
                                      setAdjustReason(item.adjustmentReason || 'Control de Calidad');`
  );

  // Update save logic
  const saveLogic = `const handleSaveAdjustment = () => {
    if (!order || !adjustingItem) return;
    
    if (adjustSizes.length > 0) {
      const sum = adjustSizes.reduce((acc, curr) => acc + curr.quantity, 0);
      if (sum !== adjustQuantity) {
        alert(\`La suma de las tallas (\${sum}) no coincide con la cantidad total a enviar (\${adjustQuantity}). Debes ajustar las tallas para que coincidan.\`);
        return;
      }
    }

    const updatedItems = order.items.map(i => {
      if (i.id === adjustingItem) {
        return {
          ...i,
          originalQuantity: i.originalQuantity || i.quantity,
          quantity: adjustQuantity,
          sizeDetails: adjustSizes.length > 0 ? adjustSizes.filter(s => s.quantity > 0) : undefined,
          adjustmentReason: adjustReason
        };
      }
      return i;
    });
    updateOrder({ ...order, items: updatedItems });
    setAdjustingItem(null);
  };`;
  code = code.replace(/const handleSaveAdjustment = \(\) => \{[\s\S]*?setAdjustingItem\(null\);\s*\};/, saveLogic);

  // Update display to show sizes in the items list
  code = code.replace(
    /<span className="text-sm font-bold text-rio-ink bg-rio-background px-2 py-0\.5 rounded border border-rio-border">Cant: \{item\.quantity\}<\/span>/g,
    `<span className="text-sm font-bold text-rio-ink bg-rio-background px-2 py-0.5 rounded border border-rio-border">Cant: {item.quantity}</span>
                                    {item.sizeDetails && item.sizeDetails.length > 0 && (
                                      <span className="text-[10px] bg-rio-surface-muted text-rio-muted px-2 py-0.5 rounded-full border border-rio-border">
                                        Tallas: {item.sizeDetails.map(s => \`\${s.size}x\${s.quantity}\`).join(', ')}
                                      </span>
                                    )}`
  );

  // Update modal UI to show sizes editor
  const sizesEditor = `
              {adjustSizes.length > 0 && (
                <div className="bg-rio-surface-muted p-3 rounded-xl border border-rio-border space-y-2 mt-2">
                  <label className="block text-xs font-bold text-rio-ink uppercase tracking-wider">Ajuste de Tallas</label>
                  {adjustSizes.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-2">
                      <span className="text-sm font-bold w-1/3">Talla {s.size}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                           const newSizes = [...adjustSizes];
                           newSizes[idx].quantity = Math.max(0, newSizes[idx].quantity - 1);
                           setAdjustSizes(newSizes);
                           setAdjustQuantity(newSizes.reduce((a,b)=>a+b.quantity, 0));
                        }} className="w-8 h-8 rounded bg-rio-background border border-rio-border font-bold">-</button>
                        <span className="font-mono font-bold w-6 text-center">{s.quantity}</span>
                        <button onClick={() => {
                           const newSizes = [...adjustSizes];
                           newSizes[idx].quantity += 1;
                           setAdjustSizes(newSizes);
                           setAdjustQuantity(newSizes.reduce((a,b)=>a+b.quantity, 0));
                        }} className="w-8 h-8 rounded bg-rio-background border border-rio-border font-bold">+</button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-rio-border flex justify-between font-bold text-sm">
                    <span>Total Tallas:</span>
                    <span className={adjustSizes.reduce((a,b)=>a+b.quantity,0) === adjustQuantity ? 'text-rio-success' : 'text-rio-danger'}>{adjustSizes.reduce((a,b)=>a+b.quantity, 0)}</span>
                  </div>
                </div>
              )}`;

  code = code.replace(
    /<div>\s*<label className="block text-xs font-bold text-rio-muted uppercase tracking-wider mb-2">Cantidad a enviar<\/label>[\s\S]*?<\/div>/,
    `$&${sizesEditor}`
  );

  // Print view (hoja de bodega style but in labels)
  code = code.replace(
    /<span className="font-bold text-\[9px\]">C:\{item\.quantity\}<\/span>/g,
    `<span className="font-bold text-[9px]">C:{item.quantity}</span>
                          {item.sizeDetails && item.sizeDetails.length > 0 && (
                            <span className="font-bold text-[8px] bg-gray-200 px-1 rounded truncate max-w-[40px]">
                              {item.sizeDetails.map(s => \`\${s.size}x\${s.quantity}\`).join(',')}
                            </span>
                          )}`
  );

  fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
  console.log("Updated pedidos/[id]/page.tsx");
}
