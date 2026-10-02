const fs = require('fs');
let content = fs.readFileSync('__tests__/hydration.test.tsx', 'utf8');

content = content.replace(
`saveDraft: vi.fn().mockImplementation((draft) => { mockDraft = draft; }),`,
`saveDraft: vi.fn().mockImplementation(async (draft) => { mockDraft = draft; }),`
);

content = content.replace(
`clearDraft: vi.fn().mockResolvedValue(undefined).mockImplementation(() => { mockDraft = undefined; }),`,
`clearDraft: vi.fn().mockImplementation(async () => { mockDraft = undefined; }),`
);

fs.writeFileSync('__tests__/hydration.test.tsx', content);
