const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');

content = content.replace(
`  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {
      const originalSetTimeout = global.setTimeout;
      let cb: any;
      (global as any).setTimeout = (callback: any) => { cb = callback; };`,
`  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {
      vi.useFakeTimers();`
);

content = content.replace(
`      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { cb(); });
      (global as any).setTimeout = originalSetTimeout;
      
      // NUNCA recarga a ciegas
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Muestra la opción de reintento
      await waitFor(() => {
         expect(screen.getByText(/Error al activar. Reintentar/i)).toBeTruthy();
      });`,
`      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { vi.advanceTimersByTime(5000); });
      
      // NUNCA recarga a ciegas
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Muestra la opción de reintento
      expect(screen.getByText(/Error al activar. Reintentar/i)).toBeTruthy();
      vi.useRealTimers();`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
