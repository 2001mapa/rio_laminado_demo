const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');

content = content.replace(
`(global as any).navigator = {
        serviceWorker: {
            controller: true,
            addEventListener: vi.fn()
        }
    };`,
`Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
            controller: true,
            addEventListener: vi.fn()
        }
      },
      writable: true,
      configurable: true
    });`
);

content = content.replace(
`      (global as any).navigator.serviceWorker.addEventListener = (e: string, cb: any) => {`,
`      global.navigator.serviceWorker.addEventListener = (e: string, cb: any) => {`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
