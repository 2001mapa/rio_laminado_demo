const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const oldMap = `          ) : (
            categories.slice(1).map(category => {`;
const newMap = `          ) : (
            catalogProducts.length > 0 ? (
              categories.slice(1).map(category => {`;

const oldEnd = `                  </div>
                </div>
              );
            })
          )}`;
const newEnd = `                  </div>
                </div>
              );
            })
            ) : (
              !isLoading && (
                <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                  <p className="text-rio-muted font-medium">No hay productos disponibles con los filtros actuales.</p>
                </div>
              )
            )
          )}`;

if (code.includes(oldMap) && code.includes(oldEnd)) {
  code = code.replace(oldMap, newMap).replace(oldEnd, newEnd);
  fs.writeFileSync('src/app/cliente/page.tsx', code);
  console.log('Fixed catalog empty state');
} else {
  console.log('Failed to match empty state bounds');
}
