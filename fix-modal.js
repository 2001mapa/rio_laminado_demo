const fs = require('fs');

let content = fs.readFileSync('src/components/CreateProductModal.tsx', 'utf8');

const regex = /const handleSubmit = async \(e: React\.FormEvent<HTMLFormElement>\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?setIsSubmitting\(false\);\n\s*\}\n\s*\};/;

const newHandleSubmit = `const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      let sku = '';
      if (isEdit && !enableSkuEdit) {
        sku = initialData.sku;
      } else {
        const rawSku = formData.get('sku');
        if (!rawSku) throw new Error('El SKU es requerido.');
        sku = (rawSku as string).toUpperCase().trim();
      }
      
      const productData = {
        sku,
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        material: formData.get('material') as string,
        price: parseFloat(formData.get('price') as string),
        physicalStock: parseInt(formData.get('physicalStock') as string, 10),
        locationCode: (formData.get('locationCode') as string || '').trim() || null,
        isActive: formData.get('isActive') === 'on'
      };

      if (isEdit) {
         if (initialData.material !== productData.material && initialData.reservedStock > 0) {
            if (!confirm(\`Este producto está reservado en pedidos. ¿Seguro que deseas cambiar el material de \${initialData.material} a \${productData.material}?\`)) {
               return;
            }
         }
         const updateRes = await updateProductAction(initialData.id, productData);
         if (!updateRes.success) {
           setError(updateRes.message);
           return;
         }
      } else {
        const createRes = await createSingleProduct({
          ...productData,
          locationCode: productData.locationCode || undefined
        });
        
        if (!createRes.success) {
          setError(createRes.message);
          return;
        }
      }

      // Subir fotos si las hay
      if (mainPhoto) {
        const compressed = await compressImage(mainPhoto);
        const photoData = new FormData();
        photoData.append('file', compressed);
        photoData.append('sku', sku);
        photoData.append('type', '1');
        await uploadProductPhoto(photoData);
      }

      if (hoverPhoto) {
        const compressed = await compressImage(hoverPhoto);
        const photoData = new FormData();
        photoData.append('file', compressed);
        photoData.append('sku', sku);
        photoData.append('type', '2');
        await uploadProductPhoto(photoData);
      }

      onComplete();
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };`;

content = content.replace(regex, newHandleSubmit);
fs.writeFileSync('src/components/CreateProductModal.tsx', content);
console.log('Fixed CreateProductModal.tsx successfully.');
