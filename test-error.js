const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[type="text"]', 'miguel.joyeria');
  await page.fill('input[type="password"]', 'RIO2026');
  await page.click('button:has-text("Ingresar")');

  console.log('Waiting for navigation...');
  await page.waitForURL('**/admin**');
  
  console.log('Navigating to order WEB-0001...');
  await page.goto('http://localhost:3000/admin/pedidos/WEB-0001');

  await page.waitForTimeout(5000); // wait for render
  
  console.log('Done testing.');
  await browser.close();
})();
