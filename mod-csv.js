const fs = require('fs');
let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

const regexPreviewType = /const \[previewData, setPreviewData\] = useState<\{ toCreate: number, toUpdate: number, errors: any\[\] \} \| null>\(null\);/;
const replacePreviewType = `const [previewData, setPreviewData] = useState<any>(null);`;
code = code.replace(regexPreviewType, replacePreviewType);

const regexPreviewRes = /setPreviewData\(\{\s*toCreate: previewResponse\.toCreate \|\| 0,\s*toUpdate: previewResponse\.toUpdate \|\| 0,\s*errors: previewResponse\.errors \|\| \[\]\s*\}\);/;
const replacePreviewRes = `setPreviewData({
                toCreate: previewResponse.toCreate || 0,
                toUpdate: previewResponse.toUpdate || 0,
                errors: previewResponse.errors || [],
                stats: previewResponse.stats || { laminado: 0, plata: 0, rodio: 0, revisar: 0 },
                samples: previewResponse.samples || []
              });`;
code = code.replace(regexPreviewRes, replacePreviewRes);

const regexUI = /<div className="flex gap-8 mb-6">\s*<div>\s*<p className="text-sm text-rio-muted">Nuevos<\/p>\s*<p className="text-2xl font-bold text-rio-success">\{previewData\.toCreate\}<\/p>\s*<\/div>\s*<div>\s*<p className="text-sm text-rio-muted">Actualizar<\/p>\s*<p className="text-2xl font-bold text-rio-ink">\{previewData\.toUpdate\}<\/p>\s*<\/div>\s*<\/div>\s*\{previewData\.errors\.length > 0 && \([\s\S]*?\}<\/div>\s*\)\}/;

const replaceUI = `<div className="flex flex-wrap gap-6 mb-6">
              <div className="bg-rio-surface-muted p-4 rounded-xl border border-rio-border flex-1 min-w-[120px]">
                <p className="text-xs text-rio-muted font-bold uppercase tracking-wider mb-1">Nuevos</p>
                <p className="text-3xl font-black text-rio-success">{previewData.toCreate}</p>
              </div>
              <div className="bg-rio-surface-muted p-4 rounded-xl border border-rio-border flex-1 min-w-[120px]">
                <p className="text-xs text-rio-muted font-bold uppercase tracking-wider mb-1">Actualizar</p>
                <p className="text-3xl font-black text-rio-ink">{previewData.toUpdate}</p>
              </div>
              {previewData.errors.length > 0 && (
                <div className="bg-rio-danger/10 p-4 rounded-xl border border-rio-danger/20 flex-1 min-w-[120px]">
                  <p className="text-xs text-rio-danger font-bold uppercase tracking-wider mb-1">Errores</p>
                  <p className="text-3xl font-black text-rio-danger">{previewData.errors.length}</p>
                </div>
              )}
            </div>
            
            {previewData.toCreate > 0 && (
              <div className="mb-6 bg-rio-surface p-4 rounded-xl border border-rio-border">
                <h4 className="text-sm font-bold text-rio-ink mb-3">Materiales Detectados (Nuevos)</h4>
                <div className="flex gap-4 mb-4">
                  <span className="text-xs bg-rio-surface-muted px-2 py-1 rounded font-bold">Laminado: {previewData.stats.laminado}</span>
                  <span className="text-xs bg-rio-surface-muted px-2 py-1 rounded font-bold">Plata: {previewData.stats.plata}</span>
                  <span className="text-xs bg-rio-surface-muted px-2 py-1 rounded font-bold">Rodio: {previewData.stats.rodio}</span>
                  {previewData.stats.revisar > 0 && (
                    <span className="text-xs bg-rio-danger/10 text-rio-danger px-2 py-1 rounded font-bold border border-rio-danger/20">Por revisar: {previewData.stats.revisar}</span>
                  )}
                </div>
                
                {previewData.samples.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-rio-muted uppercase mb-2">Ejemplos de Detección</h5>
                    <div className="space-y-1">
                      {previewData.samples.map((s: any, idx: number) => (
                        <div key={idx} className="text-xs flex justify-between border-b border-rio-border/30 pb-1">
                          <span className="font-mono text-rio-muted">{s.sku}</span>
                          <span className="truncate flex-1 px-3">{s.name}</span>
                          <span className={\`font-bold \${s.material === 'Por revisar' ? 'text-rio-danger' : 'text-rio-success'}\`}>{s.material}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {previewData.errors.length > 0 && (
              <div className="mb-6 bg-rio-danger/5 p-4 rounded-xl border border-rio-danger/20 max-h-40 overflow-y-auto">
                <h4 className="text-sm font-bold text-rio-danger mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  No se pueden importar estas filas:
                </h4>
                <ul className="list-disc pl-5 text-xs text-rio-danger space-y-1">
                  {previewData.errors.map((err: any, i: number) => (
                    <li key={i}><strong>Fila {err.row}:</strong> {err.error}</li>
                  ))}
                </ul>
              </div>
            )}`;
code = code.replace(regexUI, replaceUI);

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('CSVImporter updated');
