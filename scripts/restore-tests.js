const fs = require('fs');
let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

// Modificamos el setup
const oldSetup = 
`  let addedOrders: any[] = [];
  beforeEach(() => {
    addedOrders = [];
    mockDbPut.mockReset().mockImplementation(async (store, val) => {
      console.log(\`PUT \${store}:\`, val);
      if (store === 'pending_orders') addedOrders.push(val);
    });
    mockDbDelete.mockReset().mockImplementation(async () => {});
    mockDbGet.mockReset().mockImplementation(async () => undefined);
    mockDbGetAllFromIndex.mockReset().mockImplementation(async () => addedOrders);
    addToastMock.mockClear();
  });`;

const newSetup = 
`  let dbStore: Record<string, Record<string, any>> = { drafts: {}, pending_orders: {} };
  beforeEach(() => {
    dbStore = { drafts: {}, pending_orders: {} };
    
    mockDbPut.mockReset().mockImplementation(async (store, val, key) => {
      if (store === 'drafts') dbStore.drafts[key || val.sellerId] = val;
      if (store === 'pending_orders') dbStore.pending_orders[val.clientRequestId] = val;
    });
    mockDbDelete.mockReset().mockImplementation(async (store, key) => {
      if (store === 'drafts') delete dbStore.drafts[key];
    });
    mockDbGet.mockReset().mockImplementation(async (store, key) => {
      if (store === 'drafts') return dbStore.drafts[key];
      return undefined;
    });
    mockDbGetAllFromIndex.mockReset().mockImplementation(async (store, indexName, key) => {
      if (store === 'pending_orders') return Object.values(dbStore.pending_orders).filter(o => o.sellerId === key);
      return [];
    });
    addToastMock.mockClear();
  });`;

content = content.replace(oldSetup, newSetup);

// Añadimos Test 3 al final
const test3 = 
`
  it('3. Recarga de página tras clearDraft fallido retiene UUID, consulta IDB y bloquea duplicado', async () => {
      // SOLO falla delete!
      mockDbDelete.mockImplementation(async () => { throw new Error('IDB Delete Error') });

      const { unmount } = render(<NuevaVentaPage />);
      
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
      const confirmBtn = screen.getByText(/Finalizar Venta/i);
      
      fireEvent.click(confirmBtn);
      
      await waitFor(() => {
         expect(Object.keys(dbStore.pending_orders).length).toBe(1);
         expect(dbStore.drafts['seller-1']).toBeDefined();
         expect(dbStore.drafts['seller-1'].clientRequestId).toBeDefined();
      });

      const generatedUUID = dbStore.drafts['seller-1'].clientRequestId;

      // Desmontamos (simulando recarga de página/cierre)
      unmount();
      cleanup();

      // Montamos nuevamente
      render(<NuevaVentaPage />);

      await waitFor(() => {
         expect(screen.getByText(/MockProduct/i)).toBeTruthy();
      });

      const newConfirmBtn = screen.getByText(/Finalizar Venta/i);
      
      // SEGUNDO CLIC (Tras recarga)
      fireEvent.click(newConfirmBtn);

      await waitFor(() => {
         expect(addToastMock).toHaveBeenCalledWith('Este pedido ya está en la cola de envíos.');
      });

      expect(Object.keys(dbStore.pending_orders).length).toBe(1);
      expect(Object.keys(dbStore.pending_orders)[0]).toBe(generatedUUID);
  });
});`;

content = content.replace(/}\);[\s\n]*$/, test3);

// Fix Test 2 to use new dbStore logic
content = content.replace(
`      mockDbPut.mockImplementation(async (store, val) => {
         console.log(\`PUT \${store}:\`, val);
         if (store === 'pending_orders') addedOrders.push(val);
      });
      // SOLO falla delete!`,
`      // SOLO falla delete!`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
