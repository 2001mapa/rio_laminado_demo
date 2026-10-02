const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

const test4 = `
  it('4. Fallo al guardar el UUID en checkout detiene el envio y no promete borrador protegido', async () => {
      render(<NuevaVentaPage />);
      
      await waitFor(() => expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0));
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form'));
      
      await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy());
      
      // Hacemos que el put de drafts devuelva error JUSTO ANTES de finalizar la venta
      mockDbPut.mockImplementation(async (store, val, key) => {
         if (store === 'drafts') throw new Error('QuotaExceededError Checkout');
      });

      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Error al bloquear el borrador. Revisa tu almacenamiento local.');
      });
      
      // Verificamos que pending_orders quedó vacio (se abortó)
      expect(Object.keys(dbStore.pending_orders).length).toBe(0);
      
      // Verificamos que no se mostró el toast de éxito
      expect(addToastMock).not.toHaveBeenCalledWith('Borrador guardado localmente.');
  });
});`;

content = content.replace(/}\);[\s\n]*$/, test4);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
