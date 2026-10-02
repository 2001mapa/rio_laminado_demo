const fs = require('fs');

let content = fs.readFileSync('__tests__/phase5-server.test.ts', 'utf8');

content = content.replace(
  `vi.mock('@/app/actions/auth', () => ({`,
  `vi.mock('@/utils/auth-helpers', () => ({`
);

content = content.replace(
  `vi.mock('@/lib/prisma', () => ({`,
  `vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn(),
  getAuditActor: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'admin', type: 'user' })
}));

vi.mock('@/lib/prisma', () => ({`
);

fs.writeFileSync('__tests__/phase5-server.test.ts', content);
