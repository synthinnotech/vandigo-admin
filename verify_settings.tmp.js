const { chromium } = require('playwright');

const SCRATCH = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

  // Mock every backend call so the client route guard's fake token never
  // triggers a real 401 -> forced logout. Pure UI inspection, no real
  // network traffic reaches the remote backend.
  await page.route('**/api/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
  });

  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('vandigo_access_token', 'fake-token-for-ui-inspection');
  });

  await page.goto('http://localhost:3000/admin/settings', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=AI Assistant', { timeout: 15000 });
  await page.screenshot({ path: `${SCRATCH}/settings_full.png`, fullPage: true });

  const card = page.locator('text=Voice replies').locator('xpath=ancestor::div[contains(@class,"flex") and contains(@class,"items-center")][1]');
  await card.screenshot({ path: `${SCRATCH}/settings_voice_toggle.png` });

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(200);
  await card.screenshot({ path: `${SCRATCH}/settings_voice_toggle_dark.png` });

  console.log('DONE');
  console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
  await browser.close();
})().catch((e) => {
  console.error('SCRIPT_ERROR', e);
  process.exit(1);
});
