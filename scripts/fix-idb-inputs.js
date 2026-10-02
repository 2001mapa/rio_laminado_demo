const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`      const sizesInput = screen.getByPlaceholderText('Talla');
      const qtyInput = screen.getByPlaceholderText('Cant.');
      fireEvent.change(sizesInput, { target: { value: '7' } });
      fireEvent.change(qtyInput, { target: { value: '1' } });`,
`      const sizesInput = screen.getByPlaceholderText('Talla');
      // En Anillos, hay un input type="number" genérico a la par del Talla
      const qtyInput = sizesInput.nextElementSibling as HTMLInputElement;
      fireEvent.change(sizesInput, { target: { value: '7' } });
      fireEvent.change(qtyInput, { target: { value: '1' } });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
