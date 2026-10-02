const fs = require('fs');

let content = fs.readFileSync('__tests__/PwaUpdater.test.tsx', 'utf8');
content = content.replace('vi.useFakeTimers();', '');
content = content.replace('vi.useRealTimers();', '');

content = content.replace(
`  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {`,
`  it('3. Muestra error si controllerchange NUNCA dispara (ausente) y permite reintento', async () => {
      vi.useFakeTimers();`
);

content = content.replace(
`      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { vi.advanceTimersByTime(5000); });`,
`      // Pasan 5 segundos y controllerchange NUNCA se disparó
      act(() => { vi.advanceTimersByTime(5100); });
      vi.useRealTimers();`
);

fs.writeFileSync('__tests__/PwaUpdater.test.tsx', content);
