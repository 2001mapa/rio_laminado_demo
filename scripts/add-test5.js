const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

const test5 = `
  it('5. Dos clics: fallo en el primer saveDraft de UUID detiene proceso, el segundo guarda correctamente', async () => {
      let failedOnce = false;
      mockDbPut.mockImplementation(async (store, val, key) => {
         if (store === 'drafts' && val.clientRequestId && !failedOnce) {
             failedOnce = true;
             throw new Error('QuotaExceededError Checkout');
         }
         if (store === 'drafts') dbStore.drafts[key || val.sellerId] = val;
         if (store === 'pending_orders') dbStore.pending_orders[val.clientRequestId] = val;
      });

      render(<NuevaVentaPage />);
      
      await waitFor(() => expect(screen.getAllByText(/Cliente UI/i).length).toBeGreaterThan(0));
      fireEvent.click(screen.getAllByText(/Cliente UI/i)[0]);
      
      await waitFor(() => expect(screen.getByText(/Escáner de Productos/i)).toBeTruthy());
      
      const searchInput = screen.getByPlaceholderText('Ingresar SKU manualmente');
      fireEvent.change(searchInput, { target: { value: 'SKU1' } });
      fireEvent.submit(searchInput.closest('form')!);
      
      await waitFor(() => expect(screen.getByText(/MockProduct/i)).toBeTruthy());
      
      const allButtons = screen.getAllByRole('button');
      const addBtn = allButtons.find(b => b.textContent && b.textContent.includes('Agregar a la Orden'));
      if (addBtn) fireEvent.click(addBtn);
      
      await waitFor(() => expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy());
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      
      // PRIMER CLIC
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Error al bloquear el borrador. Revisa tu almacenamiento local.');
      });
      
      // Verificamos que pending_orders está vacío
      expect(Object.keys(dbStore.pending_orders).length).toBe(0);
      
      // SEGUNDO CLIC
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Borrador guardado localmente.');
      });
      
      // Verificamos que pending_orders tiene el registro correctamente
      expect(Object.keys(dbStore.pending_orders).length).toBe(1);
      
      const uuidGenerado = Object.keys(dbStore.pending_orders)[0];
      expect(dbStore.drafts['seller-1'].clientRequestId).toBe(uuidGenerado);
  });
});`;

content = content.replace(/}\);[\s\n]*$/, test5);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
