const fs = require('fs');

let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

const slowProgress = `
      // Calculate a smarter progress step based on number of items
      const itemsCount = parsedItems?.length || 1;
      // Estimate: ~30ms per item (Supabase usually takes a bit for bulk upserts)
      // Cap between 4s and 45s
      const estimatedMs = Math.max(4000, Math.min(itemsCount * 30, 45000));
      const stepsTo80 = estimatedMs / 300;
      const stepIncrement = 80 / stepsTo80;

      interval = setInterval(() => {
        setProgress(p => {
          if (p < 80) return p + stepIncrement;
          if (p < 98) return p + (98 - p) * 0.02; // crawl even slower after 80%
          return p;
        });
      }, 300);
`;

code = code.replace(
  /\/\/ Calculate a smarter progress step[\s\S]*?\}, 300\);/,
  slowProgress.trim()
);

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('Fixed CSV progress bar speed');
