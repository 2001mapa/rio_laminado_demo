const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');
content = content.replace(
`import { describe, it, expect, vi, beforeEach } from 'vitest';`,
`import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
