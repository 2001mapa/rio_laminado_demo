const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/[id]/page.tsx', 'utf8');

// The original UI right side block:
// <div className="flex flex-col items-end gap-2 w-full md:w-auto">
//   <span className="text-[10px] font-bold text-rio-ink bg-rio-surface-muted border border-rio-border px-2.5 py-1 rounded-md uppercase tracking-wider">
//     {(group as any).status || 'Pendiente'}
//   </span>
//   {group.id !== 'main' && (
//     <div className="flex items-center gap-2 mt-2 w-full md:w-auto">
//       <input 
//         type="text" 
//         placeholder="Nº Factura Externa" 
//         className="border border-rio-border rounded-lg px-3 py-1.5 text-sm w-full md:w-40 bg-rio-background text-rio-ink"
//         value={invoices[group.id] !== undefined ? invoices[group.id] : (group.externalInvoice || '')}
//         onChange={e => setInvoices({...invoices, [group.id]: e.target.value})}
//         disabled={!!group.externalInvoice}
//       />
//       {!group.externalInvoice && (
//         <button 
//           onClick={() => handleSaveInvoice(group.id)}
//           className="bg-rio-ink text-white px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap"
//         >Guardar</button>
//       )}
//     </div>
//   )}
// </div>

const searchRegex = /<div className="flex flex-col items-end gap-2 w-full md:w-auto">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
// Wait, the outer closing div of the `flex-row justify-between` is the second `</div>`.
const safeRegex = /<div className="flex flex-col items-end gap-2 w-full md:w-auto">[\s\S]*?Guardar<\/button>[\s\S]*?\}[\s\S]*?<\/div>[\s\S]*?\}[\s\S]*?<\/div>/;

// Let's do a more robust string replacement to be sure.
let startIndex = code.indexOf('<div className="flex flex-col items-end gap-2 w-full md:w-auto">');
if (startIndex !== -1) {
  // find the end of this div block.
  // It has a span, {group.id !== 'main' && ( <div ...> input, {!... (button)} </div>)}, closing div.
  // Actually, I can just replace this known block.
  const knownBlock = code.substring(startIndex, code.indexOf('</div>', code.indexOf('Guardar</button>')) + 15);
  // wait, let's just use string replace using the part we can see in grep.
}

code = code.replace(/<div className="flex flex-col items-end gap-2 w-full md:w-auto">[\s\S]*?Guardar<\/button>[\s\S]*?\}[\s\S]*?<\/div>[\s\S]*?\}[\s\S]*?<\/div>/, '');

// Also remove `handleSaveInvoice` logic if any, and `const [invoices, setInvoices] = useState<Record<string, string>>({});`
code = code.replace(/const \[invoices, setInvoices\] = useState<Record<string, string>>\(\{\}\);/g, '');
code = code.replace(/const handleSaveInvoice = async \(groupId: string\) => \{[\s\S]*?toast\.success\('Factura guardada'\);[\s\S]*?\} catch \(e\) \{[\s\S]*?\} finally \{[\s\S]*?\}[\s\S]*?\};/g, '');


fs.writeFileSync('src/app/admin/pedidos/[id]/page.tsx', code);
console.log('Removed invoice UI');
