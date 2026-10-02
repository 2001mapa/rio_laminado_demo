const fs = require('fs');

let content = fs.readFileSync('__tests__/hydration.test.tsx', 'utf8');

content = content.replace(
`  saveDraft: vi.fn(),`,
`  saveDraft: vi.fn().mockResolvedValue(undefined),`
);

content = content.replace(
`  clearDraft: vi.fn()`,
`  clearDraft: vi.fn().mockResolvedValue(undefined)`
);

fs.writeFileSync('__tests__/hydration.test.tsx', content);
