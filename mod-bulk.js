const fs = require('fs');
let code = fs.readFileSync('src/components/BulkPhotoUploader.tsx', 'utf8');

// Add import
if (!code.includes('logBulkPhotoUpload')) {
  code = code.replace(
    "import { uploadProductPhoto, syncOrphanedPhotos } from '@/app/actions/photos';",
    "import { uploadProductPhoto, syncOrphanedPhotos, logBulkPhotoUpload } from '@/app/actions/photos';"
  );
}

// Add skipAudit and counter logic
// Before the loop: `setIsUploading(true);\n    let successCount = 0;`
// Actually, let's find `setIsUploading(true);`
code = code.replace(
  "setIsUploading(true);",
  "setIsUploading(true);\n    let successCount = 0;"
);

// inside the loop, append skipAudit
code = code.replace(
  "formData.append('type', type);",
  "formData.append('type', type);\n        formData.append('skipAudit', 'true');"
);

// increment successCount
code = code.replace(
  "setProgress(p => ({ ...p, success: p.success + 1 }));",
  "setProgress(p => ({ ...p, success: p.success + 1 }));\n          successCount++;"
);

// After the loop
code = code.replace(
  "setIsUploading(false);\n    if (onComplete) onComplete();",
  `if (successCount > 0) {\n      await logBulkPhotoUpload(successCount);\n    }\n    setIsUploading(false);\n    if (onComplete) onComplete();`
);

fs.writeFileSync('src/components/BulkPhotoUploader.tsx', code);
console.log('Fixed BulkPhotoUploader');
