const fs = require('fs');

let content = fs.readFileSync('__tests__/idb-failures.test.tsx', 'utf8');

content = content.replace(
`      // Volvemos a hacer clic (el UUID se conservó en memoria y se actualizó pendingQueue)
      fireEvent.click(confirmBtn);`,
`      // Volvemos a hacer clic (el UUID se conservó en memoria y se actualizó pendingQueue)
      console.log('Test addedOrders:', addedOrders);
      fireEvent.click(confirmBtn);`
);

fs.writeFileSync('__tests__/idb-failures.test.tsx', content);
