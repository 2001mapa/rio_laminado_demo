const fs = require('fs');

let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

if (!code.includes('onlineUsers: string[]')) {
  code = code.replace(
    'isLoaded: boolean;',
    'isLoaded: boolean;\n  onlineUsers: string[];'
  );

  code = code.replace(
    'const [isLoaded, setIsLoaded] = useState(false);',
    'const [isLoaded, setIsLoaded] = useState(false);\n  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);\n  const [currentUserAuthId, setCurrentUserAuthId] = useState<string | null>(null);'
  );

  code = code.replace(
    /const role = session\.user\.user_metadata\?\.role \|\| 'admin';/,
    "setCurrentUserAuthId(session.user.id);\n        const role = session.user.user_metadata?.role || 'admin';"
  );

  code = code.replace(
    /\} else \{\s*setCurrentCustomer\(null\);\s*setCurrentSeller\(null\);\s*\}/,
    `} else {
          setCurrentUserAuthId(null);
          setCurrentCustomer(null);
          setCurrentSeller(null);
        }`
  );

  code = code.replace(
    /isLoaded,\s*\}\}>/,
    "isLoaded,\n        onlineUsers,\n      }}>"
  );

  fs.writeFileSync('src/lib/DemoContext.tsx', code);
  console.log('DemoContext states added');
}
