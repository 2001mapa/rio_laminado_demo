const fs = require('fs');

let code = fs.readFileSync('src/components/CSVImporter.tsx', 'utf8');

// 1. Add progress state
if (!code.includes('const [progress, setProgress] = useState(0);')) {
  code = code.replace(
    /const \[status, setStatus\] = useState/,
    `const [progress, setProgress] = useState(0);\n  const [status, setStatus] = useState`
  );
}

// 2. Add useEffect for artificial progress
const progressEffect = `
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'uploading') {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => {
          // Fast up to 80%, then slower
          if (p < 80) return p + (80 - p) * 0.1;
          if (p < 95) return p + (95 - p) * 0.02;
          return p;
        });
      }, 300);
    } else if (status === 'success') {
      setProgress(100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [status]);
`;

if (!code.includes('if (status === \'uploading\') {')) {
  code = code.replace(
    /const handleFileChange =/,
    `${progressEffect}\n\n  const handleFileChange =`
  );
}

// 3. Replace the uploading status UI
const uploadingUI = `
              {status === 'uploading' && (
                <div className="py-8 px-6 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-rio-ink/20 border-t-rio-ink rounded-full animate-spin"></div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-rio-ink">Sincronizando {parsedItems.length} referencias...</p>
                    <p className="text-xs text-rio-muted mt-1">Por favor no cierres esta ventana. Esto puede tomar unos segundos.</p>
                  </div>
                  <div className="w-full bg-rio-surface-muted rounded-full h-2.5 mt-4 overflow-hidden border border-rio-border">
                    <div 
                      className="bg-rio-gold h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: \`\${Math.round(progress)}%\` }}
                    ></div>
                  </div>
                  <p className="text-[10px] font-bold text-rio-muted">{Math.round(progress)}%</p>
                </div>
              )}
`;

code = code.replace(
  /\{status === 'uploading' && \([\s\S]*?Aplicando cambios en la base de datos\.\.\.<\/p>\s*<\/div>\s*\)\}/,
  uploadingUI
);

fs.writeFileSync('src/components/CSVImporter.tsx', code);
console.log('Added progress bar to CSVImporter');
