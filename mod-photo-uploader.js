const fs = require('fs');
let code = fs.readFileSync('src/components/BulkPhotoUploader.tsx', 'utf8');

const importRegex = /import \{ uploadProductPhoto \} from '@\/app\/actions\/photos';/;
if (code.match(importRegex)) {
  code = code.replace(importRegex, "import { uploadProductPhoto, syncOrphanedPhotos } from '@/app/actions/photos';");
}

const stateRegex = /const \[isUploading, setIsUploading\] = useState\(false\);/;
if (code.match(stateRegex)) {
  code = code.replace(stateRegex, "const [isUploading, setIsUploading] = useState(false);\n  const [isSyncing, setIsSyncing] = useState(false);\n  const [syncResult, setSyncResult] = useState('');");
}

const syncFn = `
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult('');
    try {
      const res = await syncOrphanedPhotos();
      if (res.success) {
        setSyncResult(\`¡Sincronización exitosa! \${res.updated} productos recuperaron su foto.\`);
      } else {
        setSyncResult('Error al sincronizar: ' + res.message);
      }
    } catch (e) {
      setSyncResult('Error de conexión');
    }
    setIsSyncing(false);
  };
`;

const resetRegex = /const reset = \(\) => \{/;
if (code.match(resetRegex)) {
  code = code.replace(resetRegex, syncFn + "\n  const reset = () => {\n    setSyncResult('');");
}

const buttonsRegex = /<\/button>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\}/;
if (code.match(buttonsRegex)) {
  code = code.replace(buttonsRegex, `</button>
          )}
          
          {!isUploading && progress.total === 0 && (
            <div className="mt-4 pt-4 border-t border-rio-border/50 text-center">
              <button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="text-xs text-rio-muted hover:text-rio-gold transition-colors flex items-center justify-center mx-auto"
              >
                {isSyncing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Database className="w-3 h-3 mr-1" />}
                {isSyncing ? 'Buscando fotos huérfanas...' : 'Recuperar fotos de la nube'}
              </button>
              {syncResult && <p className="text-[11px] mt-2 text-rio-ink/70 bg-rio-background p-1.5 rounded">{syncResult}</p>}
            </div>
          )}
        </div>
      </div>
    );
}`);
}

const iconsRegex = /import \{ Upload, X, CheckCircle, Image as ImageIcon, AlertTriangle, Loader2 \} from 'lucide-react';/;
if (code.match(iconsRegex)) {
  code = code.replace(iconsRegex, "import { Upload, X, CheckCircle, Image as ImageIcon, AlertTriangle, Loader2, Database } from 'lucide-react';");
}

fs.writeFileSync('src/components/BulkPhotoUploader.tsx', code);
console.log('Modified BulkPhotoUploader for sync');
