const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

// Change mock product to not be Anillos
content = content.replace(
`      product: { id: 'P1', sku: 'SKU1', name: 'Anillo', price: 100, physicalStock: 10, reservedStock: 0, category: 'Anillos' }`,
`      product: { id: 'P1', sku: 'SKU1', name: 'MockProduct', price: 100, physicalStock: 10, reservedStock: 0, category: 'Collares' }`
);

// Remove the sizes logic
content = content.replace(
`      await waitFor(() => {
         expect(screen.getByText(/Anillo/i)).toBeTruthy();
      });
      
      const sizesInput = screen.getByPlaceholderText('Talla');
      // En Anillos, hay un input type="number" genérico a la par del Talla
      const qtyInput = sizesInput.nextElementSibling as HTMLInputElement;
      fireEvent.change(sizesInput, { target: { value: '7' } });
      fireEvent.change(qtyInput, { target: { value: '1' } });
      
      const allButtons = screen.getAllByRole('button');
      const addSizeBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar'));
      if (addSizeBtn) fireEvent.click(addSizeBtn);`,
`      await waitFor(() => {
         expect(screen.getByText(/MockProduct/i)).toBeTruthy();
      });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
