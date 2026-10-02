const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');

content = content.replace(
`      const btn = screen.getByRole('button', { name: /Actualizar/i });
      expect(btn.hasAttribute('disabled')).toBe(false);`,
`      await waitFor(() => {
          const btn = screen.getByRole('button', { name: /Actualizar/i });
          expect(btn.hasAttribute('disabled')).toBe(false);
      });`
);

content = content.replace(
`      const btn = screen.getByRole('button', { name: /Actualizar/i });
      fireEvent.click(btn);`,
`      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
          expect(btn.hasAttribute('disabled')).toBe(false);
      });
      fireEvent.click(btn);`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
