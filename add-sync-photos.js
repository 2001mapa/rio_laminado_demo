const fs = require('fs');
let code = fs.readFileSync('src/app/actions/photos.ts', 'utf8');

const newCode = `
export async function syncOrphanedPhotos() {
  try {
    await requireRole(['admin']);
    const supabase = await createClient();
    
    // Obtener productos sin foto principal o sin foto secundaria
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { hoverImageUrl: null }
        ]
      }
    });

    let updated = 0;
    
    // Check in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (p) => {
        let changed = false;
        let newImageUrl = p.imageUrl;
        let newHoverImageUrl = p.hoverImageUrl;

        // Comprobar foto 1
        if (!p.imageUrl) {
          const filename = \`\${p.sku.toUpperCase()}_1.webp\`;
          const { data } = supabase.storage.from('productos').getPublicUrl(filename);
          try {
            const res = await fetch(data.publicUrl, { method: 'HEAD' });
            if (res.ok) {
              newImageUrl = data.publicUrl;
              changed = true;
            }
          } catch (e) {
            // Ignorar
          }
        }

        // Comprobar foto 2
        if (!p.hoverImageUrl) {
          const filename = \`\${p.sku.toUpperCase()}_2.webp\`;
          const { data } = supabase.storage.from('productos').getPublicUrl(filename);
          try {
            const res = await fetch(data.publicUrl, { method: 'HEAD' });
            if (res.ok) {
              newHoverImageUrl = data.publicUrl;
              changed = true;
            }
          } catch (e) {
            // Ignorar
          }
        }

        if (changed) {
          await prisma.product.update({
            where: { id: p.id },
            data: { imageUrl: newImageUrl, hoverImageUrl: newHoverImageUrl }
          });
          updated++;
        }
      }));
    }

    return { success: true, updated };
  } catch (error: any) {
    console.error('Error in syncOrphanedPhotos:', error);
    return { success: false, message: error.message };
  }
}
`;

code += newCode;
fs.writeFileSync('src/app/actions/photos.ts', code);
console.log('Added syncOrphanedPhotos');
