const fs = require('fs');
let code = fs.readFileSync('src/app/cliente/page.tsx', 'utf8');

const regex = /categories\.slice\(1\)\.map\(category => \{[\s\S]*?return \([\s\S]*?\}\)[\s\S]*?\}\)[\s\S]*?\n          \)/;

const newCode = `catalogProducts.length > 0 ? categories.slice(1).map(category => {
              const categoryProducts = catalogProducts.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category} id={\`category-\${category}\`} className="scroll-mt-28 md:scroll-mt-36 space-y-4 md:space-y-6">
                  <div className="flex items-end justify-between border-b border-rio-border/30 pb-2">
                    <h2 className="font-serif text-2xl md:text-3xl text-rio-ink font-bold">{category}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                    {categoryProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onExpand={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                </div>
              );
            }) : (
              !isLoading && (
                <div className="text-center py-20 bg-rio-surface rounded-2xl border border-rio-border shadow-sm">
                  <p className="text-rio-muted font-medium">No hay productos disponibles con los filtros actuales.</p>
                </div>
              )
            )`;

const start = code.indexOf('categories.slice(1).map(category => {');
if (start !== -1) {
  // Encuentra el final de este bloque. Sabemos que termina antes de `<div ref={loaderRef}`
  const loaderStart = code.indexOf('<div ref={loaderRef}', start);
  const beforeLoader = code.lastIndexOf(')', loaderStart); // El ) que cierra el ternario superior
  
  if (loaderStart !== -1) {
    // vamos a cortar hasta loaderStart - 10 más o menos y buscar el paréntesis
    let substr = code.substring(start, loaderStart);
    let lastParen = substr.lastIndexOf(')');
    
    code = code.substring(0, start) + newCode + substr.substring(lastParen + 1) + code.substring(loaderStart);
    fs.writeFileSync('src/app/cliente/page.tsx', code);
    console.log('Fixed catalog empty state with magic boundaries');
  }
}
