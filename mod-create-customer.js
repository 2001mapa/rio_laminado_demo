const fs = require('fs');

let code = fs.readFileSync('src/components/CreateCustomerModal.tsx', 'utf8');

// Add password state and validation
code = code.replace(
  'const [copied, setCopied] = useState(false);',
  `const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState(() => Math.random().toString(36).slice(-8).toUpperCase());
  
  const generatePassword = () => {
    setPassword(Math.random().toString(36).slice(-8).toUpperCase() + Math.floor(Math.random() * 10));
  };
  `
);

// Update handleSubmit to check password length
code = code.replace(
  "const formData = new FormData(e.currentTarget);",
  `const formData = new FormData(e.currentTarget);
    const tempPass = formData.get('temporaryPassword') as string;
    if (tempPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }`
);

// Update password input field to be controlled or have button
const passInputRegex = /<input name="temporaryPassword".*?defaultValue=\{Math\.random\(\)\.toString\(36\)\.slice\(-8\)\.toUpperCase\(\)\}.*?\/>/;
const passReplacement = `
                  <div className="flex gap-2">
                    <input name="temporaryPassword" required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-rio-border rounded-xl p-2.5 text-sm bg-rio-background focus:ring-1 focus:ring-rio-gold focus:border-rio-gold font-mono" placeholder="Ej. RIO1234" />
                    <button type="button" onClick={generatePassword} className="px-3 py-2 bg-rio-surface-muted border border-rio-border rounded-xl text-xs font-bold text-rio-ink hover:bg-rio-border transition-colors">
                      Generar
                    </button>
                  </div>
`;
code = code.replace(passInputRegex, passReplacement.trim());

// Update WhatsApp buttons
const copyButtonRegex = /<button[\s\S]*?onClick=\{copyInviteLink\}[\s\S]*?Copiar Mensaje para WhatsApp\}[\s\S]*?<\/button>/;
const waButtons = `
              <div className="flex gap-2">
                {successData.phone && successData.phone.replace(/\\D/g, '').length >= 10 ? (
                  <a 
                    href={\`https://wa.me/\${successData.phone.replace(/\\D/g, '')}?text=\${encodeURIComponent(\`¡Hola \${successData.name}! Aquí tienes tu acceso exclusivo al catálogo mayorista de RIO. \\n\\n🔗 Ingresa aquí: \${typeof window !== 'undefined' ? window.location.origin : ''}/login\\n👤 Usuario: \${successData.username}\\n🔑 Contraseña temporal: \${successData.temporaryPassword}\`)}\`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-[13px] font-bold hover:bg-green-600 transition-colors flex justify-center items-center gap-2"
                  >
                    Enviar por WhatsApp
                  </a>
                ) : null}
                <button 
                  onClick={copyInviteLink}
                  className="flex-1 py-2.5 bg-rio-surface-muted border border-rio-border rounded-lg text-[13px] font-bold text-rio-ink hover:bg-rio-border transition-colors flex justify-center items-center gap-2"
                >
                  {copied ? '¡Copiado!' : 'Copiar Mensaje'}
                </button>
              </div>
`;
code = code.replace(copyButtonRegex, waButtons.trim());

fs.writeFileSync('src/components/CreateCustomerModal.tsx', code);
console.log('Updated CreateCustomerModal');
