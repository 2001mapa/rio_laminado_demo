const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');

content = content.replace(
`  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {
      vi.useFakeTimers();`,
`  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {`
);

content = content.replace(
`      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
      });
      
      fireEvent.click(btn);
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { vi.advanceTimersByTime(5000); });`,
`      let btn: any;
      await waitFor(() => {
          btn = screen.getByRole('button', { name: /Actualizar/i });
      });
      
      vi.useFakeTimers();
      fireEvent.click(btn);
      expect((global as any).window.location.reload).not.toHaveBeenCalled();
      
      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { vi.advanceTimersByTime(5000); });`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
