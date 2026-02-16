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
    await new Promise(r => setTimeout(r, 500));

    const toggle = await page.$('#sidebarToggle');
    const sidebar = await page.$('#sidebar');
    if (!toggle || !sidebar) { console.log(`${vp.name}: Toggle or sidebar missing`); continue; }

    // Ensure starting state: expanded on desktop, hidden on mobile (per JS)
    await page.evaluate(() => {
      document.querySelector('#sidebar').classList.remove('collapsed');
      document.querySelector('#sidebar').classList.remove('active');
    });
    await new Promise(r => setTimeout(r, 200));

    const expanded = await page.evaluate(() => !document.querySelector('#sidebar').classList.contains('collapsed') && !document.querySelector('#sidebar').classList.contains('active'));
    console.log(`${vp.name}: starting expanded=${expanded}`);

    // Toggle to collapse and verify nav-text not visible
    if (vp.width <= 768) {
      await page.evaluate(() => document.querySelector('#sidebar').classList.add('active'));
    } else {
      await page.evaluate(() => document.querySelector('#sidebar').classList.add('collapsed'));
    }
    await new Promise(r => setTimeout(r, 200));

    const collapsed = await page.evaluate(() => document.querySelector('#sidebar').classList.contains('collapsed') || document.querySelector('#sidebar').classList.contains('active'));
    console.log(`${vp.name}: after toggle collapsed/state active? ${collapsed}`);

    // Check nav-text visibility
    const navTexts = await page.$$('.nav-text');
    for (let i=0;i<navTexts.length && i<5;i++) {
      const visible = await page.evaluate(e => {
        const style = window.getComputedStyle(e);
        return style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
      }, navTexts[i]);
      const text = await page.evaluate(e => e.textContent.trim(), navTexts[i]);
      console.log(`  nav-text [${i}] '${text}' visible=${visible}`);
    }

    // Toggle again to expand back to original
    if (vp.width <= 768) {
      await page.evaluate(() => document.querySelector('#sidebar').classList.remove('active'));
    } else {
      await page.evaluate(() => document.querySelector('#sidebar').classList.remove('collapsed'));
    }
    await new Promise(r => setTimeout(r, 200));
    const expandedAgain = await page.evaluate(() => !document.querySelector('#sidebar').classList.contains('collapsed') && !document.querySelector('#sidebar').classList.contains('active'));
    console.log(`${vp.name}: after second toggle expanded=${expandedAgain}`);

    // ensure nav-text visible after expanding
    for (let i=0;i<navTexts.length && i<5;i++) {
      const visible = await page.evaluate(e => {
        const style = window.getComputedStyle(e);
        return style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
      }, navTexts[i]);
      const text = await page.evaluate(e => e.textContent.trim(), navTexts[i]);
      console.log(`  nav-text [${i}] '${text}' visibleAfterExpand=${visible}`);
    }
  }

  await browser.close();
})();
