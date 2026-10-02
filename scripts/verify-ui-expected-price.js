const fs = require('fs');
let content = fs.readFileSync('__tests__/page-ui.test.tsx', 'utf8');

content = content.replace(
  `expect(addPendingOrder).toHaveBeenCalledWith(`,
  `expect(addPendingOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ expectedPrice: expect.any(Number) })
          ])
        }),`
);

fs.writeFileSync('__tests__/page-ui.test.tsx', content);
