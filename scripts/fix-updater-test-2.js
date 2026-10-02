const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');

content = content.replace(
`    (global as any).window = {
        location: { reload: vi.fn() },
        workbox: {
            addEventListener: (e: string, cb: any) => { workboxEvents[e] = cb; },
            removeEventListener: vi.fn(),
            getSW: vi.fn().mockResolvedValue(mockWorker)
        }
    };`,
`    (global as any).window.workbox = {
        addEventListener: (e: string, cb: any) => { workboxEvents[e] = cb; },
        removeEventListener: vi.fn(),
        getSW: vi.fn().mockResolvedValue(mockWorker)
    };
    
    // location is unconfigurable in JSDOM, we can mock it by deleting and redefining
    delete (global as any).window.location;
    (global as any).window.location = { reload: vi.fn() };
    `
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
