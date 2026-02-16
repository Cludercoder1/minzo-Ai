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

    const sidebar = await page.$('#sidebar');
    if (!sidebar) { console.log(`${vp.name}: Sidebar not found`); continue; }
    const sb = await sidebar.boundingBox();
    console.log(`${vp.name}: sidebar x=${sb.x.toFixed(1)}, width=${sb.width.toFixed(1)}, right=${(sb.x + sb.width).toFixed(1)}`);

    const items = await page.$$('#sidebar .nav-item, #sidebar .project-list-item, #sidebar .chat-list-item');
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      const rect = await el.boundingBox();
      if (!rect) continue;
      const rightEdge = rect.x + rect.width;
      const overhang = rightEdge - (sb.x + sb.width);
      if (overhang > 0.5) {
        const text = await page.evaluate(e => e.innerText.trim().replace(/\s+/g,' '), el);
        console.log(`  [${i}] Overhang ${overhang.toFixed(1)} px: ${text}`);
      }
    }

    // Check if any child has clip via getComputedStyle
    const clipped = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('#sidebar *'));
      return nodes.filter(n => {
        const style = window.getComputedStyle(n);
        return /(hidden|clip)/.test(style.overflow);
      }).slice(0,10).map(n => ({tag:n.tagName, cls: n.className}));
    });
    if (clipped.length) console.log(`  clipped nodes sample: ${JSON.stringify(clipped)}`);
  }

  await browser.close();
})();
