const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');

content = content.replace(
`import { render, screen, fireEvent, waitFor } from '@testing-library/react';`,
`import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';`
);

content = content.replace(
`describe('PwaUpdater Component', () => {
  let mockWorker: any;`,
`describe('PwaUpdater Component', () => {
  let mockWorker: any;
  
  afterEach(() => {
    cleanup();
  });`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
