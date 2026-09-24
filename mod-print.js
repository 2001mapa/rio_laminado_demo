const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/imprimir/page.tsx', 'utf8');

const regex = /<table className="w-full text-left border-collapse mt-4 text-\[11px\]">[\s\S]*?<\/table>/;
const replace = `{(() => {
        const groups = (order.groups && order.groups.length > 0)
          ? order.groups
          : [{ id: 'main', material: 'General', groupNumber: order.number, items: [] }];

        return groups.map(group => {
          const gItems = order.groups && order.groups.length > 0 
            ? sortedItems.filter(i => i.materialGroupId === group.id)
            : sortedItems;
            
          return (
            <div key={group.id} className="mb-6 border-b-2 border-black border-dashed pb-4 last:border-0 last:pb-0">
              <h3 className="font-bold text-lg mb-2 uppercase border-b border-black inline-block">MATERIAL: {group.material}</h3>
              <p className="text-xs font-bold mb-2">GRUPO: {group.groupNumber}</p>
              
              <table className="w-full text-left border-collapse mt-2 text-[11px]">
                <thead>
                  <tr className="border-b border-black">
                    <th className="py-1">Loc</th>
                    <th className="py-1">REF</th>
                    <th className="py-1">CANT</th>
                    <th className="py-1">OK</th>
                  </tr>
                </thead>
                <tbody className="align-top font-mono">
                  {gItems.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-1.5 w-12 font-bold">{product?.locationCode || '-'}</td>
                        <td className="py-1.5 pr-2 font-bold text-xs">{product?.sku}</td>
                        <td className="py-1.5 w-10 font-bold text-sm text-center border-l border-gray-200">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 w-10 border-l border-gray-200 text-center">
                          <div className="w-4 h-4 border border-black rounded-sm mx-auto"></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-center font-bold text-xs uppercase tracking-widest bg-gray-100 p-1">
                -- FIN DE {group.material} --
              </div>
            </div>
          );
        });
      })()}`;

code = code.replace(regex, replace);
fs.writeFileSync('src/app/admin/pedidos/[id]/imprimir/page.tsx', code);
console.log('print layout updated');
