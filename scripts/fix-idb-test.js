const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`vi.mock('@/app/actions/queries', () => ({`,
`vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })
}));

vi.mock('@/app/actions/queries', () => ({`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
