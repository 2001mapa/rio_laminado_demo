const fs = require('fs');

let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

const newEffect = `
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'uploading') {
      setProgress(0);
      
      // Calculate a smarter progress step based on number of items
      const itemsCount = parsedItems?.length || 1;
      // Estimate: ~5ms per item, minimum 2s, max 20s
      const estimatedMs = Math.max(2000, Math.min(itemsCount * 5, 20000));
      const stepsTo80 = estimatedMs / 300;
      const stepIncrement = 80 / stepsTo80;

      interval = setInterval(() => {
        setProgress(p => {
          if (p < 80) return p + stepIncrement;
          if (p < 98) return p + (98 - p) * 0.05; // very slow crawl at the end
          return p;
        });
      }, 300);
    } else if (status === 'success') {
      setProgress(100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [status, parsedItems]);
`;

code = code.replace(
  /useEffect\(\(\) => \{\s*let interval: NodeJS\.Timeout;\s*if \(status === 'uploading'\) \{[\s\S]*?\}, \[status\]\);/,
  newEffect.trim()
);

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('Fixed CSV progress bar to be smarter');
