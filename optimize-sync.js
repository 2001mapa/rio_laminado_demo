const fs = require('fs');
let code = fs.readFileSync('src/app/actions/photos.ts', 'utf8');

const newFn = `export async function syncOrphanedPhotos() {
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

    if (products.length === 0) return { success: true, updated: 0 };

    // Bajar lista completa del bucket
    let allFiles: string[] = [];
    let hasMore = true;
    let offset = 0;
    while (hasMore) {
        const { data, error } = await supabase.storage.from('productos').list('', { limit: 1000, offset });
        if (error) break;
        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allFiles.push(...data.map(f => f.name));
            if (data.length < 1000) hasMore = false;
            else offset += 1000;
        }
    }

    const fileSet = new Set(allFiles);
    let updated = 0;
    const updates = [];

    for (const p of products) {
        let changed = false;
        let newImageUrl = p.imageUrl;
        let newHoverImageUrl = p.hoverImageUrl;

        if (!p.imageUrl) {
            const filename = \`\${p.sku.toUpperCase()}_1.webp\`;
            if (fileSet.has(filename)) {
                const { data } = supabase.storage.from('productos').getPublicUrl(filename);
                newImageUrl = data.publicUrl;
                changed = true;
            }
        }

        if (!p.hoverImageUrl) {
            const filename = \`\${p.sku.toUpperCase()}_2.webp\`;
            if (fileSet.has(filename)) {
                const { data } = supabase.storage.from('productos').getPublicUrl(filename);
                newHoverImageUrl = data.publicUrl;
                changed = true;
            }
        }

        if (changed) {
            updates.push(prisma.product.update({
                where: { id: p.id },
                data: { imageUrl: newImageUrl, hoverImageUrl: newHoverImageUrl }
            }));
            updated++;
        }
    }

    if (updates.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < updates.length; i += chunkSize) {
            await prisma.$transaction(updates.slice(i, i + chunkSize));
        }
    }

    return { success: true, updated };
  } catch (error: any) {
    console.error('Error in syncOrphanedPhotos:', error);
    return { success: false, message: error.message };
  }
}`;

const startIdx = code.indexOf('export async function syncOrphanedPhotos() {');

if (startIdx !== -1) {
  code = code.substring(0, startIdx) + newFn + '\n';
  fs.writeFileSync('src/app/actions/photos.ts', code);
  console.log('Replaced syncOrphanedPhotos');
} else {
  console.log('Could not find syncOrphanedPhotos');
}
