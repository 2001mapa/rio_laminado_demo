/**
 * Utilidad para comprimir imágenes en el cliente (iPhone/PC) antes de subirlas a Supabase.
 * Esto protege el límite gratuito de 1GB de Supabase transformando fotos de 5MB en 
 * fotos de ~100KB en formato WebP, manteniendo excelente calidad visual.
 */

export const compressImage = async (
  file: File,
  maxWidth = 1000, // Resolución máxima (1000px es perfecto para ver en detalle)
  quality = 0.75 // 75% de calidad, el ojo humano no nota la compresión
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Si no es una imagen, la dejamos pasar intacta
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar manteniendo la proporción si excede el maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Si falla, devolvemos el original
          return;
        }

        // Pintamos la imagen redimensionada en el lienzo (canvas)
        ctx.drawImage(img, 0, 0, width, height);

        // Forzamos formato WebP (el más liviano para web moderno)
        const mimeType = 'image/webp'; 
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            // Reemplazamos la extensión del nombre por .webp
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const newFileName = `${originalName}.webp`;

            const compressedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = (error) => reject(error);
    };
    
    reader.onerror = (error) => reject(error);
  });
};
