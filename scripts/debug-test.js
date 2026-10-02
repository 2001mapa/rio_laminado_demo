const fs = require('fs');
let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`      await waitFor(() => {
         // El toast de error de try/catch
         expect(addToastMock).toHaveBeenCalledWith('Error guardando el borrador local');
         // El botón Finalizar Venta sigue presente porque NO se vació el carrito
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });`,
`      await waitFor(() => {
         console.log("Toasts called:", addToastMock.mock.calls);
         console.log("Delete calls:", mockDbDelete.mock.calls);
         // El toast de error de try/catch
         expect(addToastMock).toHaveBeenCalledWith('Error guardando el borrador local');
         // El botón Finalizar Venta sigue presente porque NO se vació el carrito
         expect(screen.getByText(/Finalizar Venta/i)).toBeTruthy();
      });`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
