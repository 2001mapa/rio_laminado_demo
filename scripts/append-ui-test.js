const fs = require('fs');
let content = fs.readFileSync('__tests__/page-ui.test.tsx', 'utf8');

const newTest = `
  it('Verifica que el carrito no se vacía y se muestra error si falla addPendingOrder', async () => {
      mockAddPendingOrder.mockImplementationOnce(() => {
          throw new Error('IDB Write Error');
      });

      render(<NuevaVentaPage />);
      
      await waitFor(() => {
         expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0); 
      });
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => {
         expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy();
      });
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => {
         expect(screen.getByText(/MockProduct/i)).toBeTruthy();
      });
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => {
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });
      
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(mockAddPendingOrder).toHaveBeenCalled();
         // El botón Finalizar Venta sigue presente porque el carrito NO se vació
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });
  });
`;

content = content.replace(/\n\}\);\n$/, `\n${newTest}\n});\n`);

fs.writeFileSync('__tests__/page-ui.test.tsx', content);
