const fs = require('fs');

let code = fs.readFileSync('src/app/vendedor/nueva-venta/page.tsx', 'utf8');

const regex = /<p className="text-rio-gold-dark font-black">\{formatPrice\(scannedProduct\.price\)\}<\/p>\s*<\/div>\s*<\/div>/m;
const replacement = `<p className="text-rio-gold-dark font-black">{formatPrice(scannedProduct.price)}</p>
                            <div className="mt-1.5 flex items-center">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-rio-success/10 text-rio-success border border-rio-success/20">
                                {scannedProduct.physicalStock - scannedProduct.reservedStock} disponibles
                              </span>
                            </div>
                          </div>
                        </div>`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/app/vendedor/nueva-venta/page.tsx', code);
console.log('Added available stock indicator via file script');
