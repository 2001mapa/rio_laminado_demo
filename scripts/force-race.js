const fs = require('fs');

let content = fs.readFileSync('__tests__/phase4.test.ts', 'utf8');
content = content.replace(
`        const store: Record<string, string> = {};
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => store[k] || null,
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };`,
`        const store: Record<string, string> = {};
        let getItemCalls = 0;
        (global as any).window = {
            localStorage: {
                getItem: (k: string) => {
                    // Forzamos la carrera simulando que ambas leen antes de que la otra escriba
                    getItemCalls++;
                    if (getItemCalls <= 2) return null;
                    return store[k] || null;
                },
                setItem: (k: string, v: string) => store[k] = v,
                removeItem: (k: string) => delete store[k]
            }
        };`
);

fs.writeFileSync('__tests__/phase4.test.ts', content);
