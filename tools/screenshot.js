const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const url = 'http://localhost:5000/';

  const viewports = [
    { name: 'desktop', width: 1366, height: 768 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'networkidle2' });
    // wait for sidebar to appear
    await page.waitForSelector('#sidebar');
    await new Promise(r => setTimeout(r, 500));
    // full page screenshot
    await page.screenshot({ path: `screenshot-${vp.name}.png`, fullPage: true });
    // capture just the sidebar
    const sidebar = await page.$('#sidebar');
    if (sidebar) {
      await sidebar.screenshot({ path: `sidebar-${vp.name}.png` });
    }
    // also capture a 200x200 area around the toggle if present
    try {
      const toggle = await page.$('#sidebarToggle');
      if (toggle) {
        const rc = await toggle.boundingBox();
        if (rc) {
          const margin = 80;
          const x = Math.max(0, rc.x - margin);
          const y = Math.max(0, rc.y - margin);
          const w = Math.min(vp.width - x, rc.width + margin * 2);
          const h = Math.min(vp.height - y, rc.height + margin * 2);
          await page.screenshot({ path: `toggle-${vp.name}.png`, clip: { x, y, width: w, height: h } });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  await browser.close();
  console.log('Screenshots generated');
})();
