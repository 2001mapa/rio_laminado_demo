const fs = require('fs');
let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

const regexSetPreview = /setPreviewData\(\{[\s\S]*?samples: previewResponse\.samples \|\| \[\]\n\s*\}\);/;
const matchPreview = code.match(regexSetPreview);
if (matchPreview) {
  code = code.replace(regexSetPreview, `setPreviewData({
                  toCreate: previewResponse.toCreate || 0,
                  toUpdate: previewResponse.toUpdate || 0,
                  errors: previewResponse.errors || [],
                  warnings: previewResponse.warnings || [],
                  stats: previewResponse.stats || { laminado: 0, plata: 0, rodio: 0, revisar: 0 },
                  samples: previewResponse.samples || []
                });`);
}

const regexRender = /\{previewData\.errors\.length > 0 && \([\s\S]*?<\/ul>\n\s*<\/div>\n\s*\)\}/;
const matchRender = code.match(regexRender);
if (matchRender) {
  code = code.replace(regexRender, `{previewData.errors.length > 0 && (
                      <div className="mt-3 bg-rio-danger/10 border border-rio-danger/20 rounded-lg p-3">
                        <p className="text-xs font-bold text-rio-danger mb-2">Se detectaron {previewData.errors.length} errores:</p>
                        <ul className="text-[11px] text-rio-danger/80 space-y-1 max-h-24 overflow-y-auto pr-2">
                          {previewData.errors.map((e: any, idx: number) => (
                            <li key={idx}><span className="font-semibold">Fila {e.row}:</span> {e.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {previewData.warnings && previewData.warnings.length > 0 && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-yellow-800 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> Advertencias de Ubicación (No bloquea la subida):</p>
                        <ul className="text-[11px] text-yellow-700 space-y-1">
                          {previewData.warnings.map((w: string, idx: number) => (
                            <li key={idx}>- {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}`);
}

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('Modified CSVImporter.tsx for warnings');
