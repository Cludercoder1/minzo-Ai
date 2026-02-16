const puppeteer = require('puppeteer');

function rectsIntersect(a, b) {
  return !(b.x >= a.x + a.width || b.x + b.width <= a.x || b.y >= a.y + a.height || b.y + b.height <= a.y);
}

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

    const tb = await toggle.boundingBox();
    const sb = await sidebar.boundingBox();
    console.log(`${vp.name}: Sidebar [x=${sb.x}, w=${sb.width}], Toggle [x=${tb.x}, w=${tb.width}]`);

    const items = await page.$$('#sidebar .nav-item, #sidebar .project-list-item, #sidebar .chat-list-item');
    for (let i = 0; i < items.length; i++) {
      const rect = await items[i].boundingBox();
      if (!rect) continue;
      if (rectsIntersect(tb, rect)) {
        const text = await page.evaluate(e => e.innerText.trim().replace(/\s+/g,' '), items[i]);
        console.log(`  overlaps with [${i}] ${text}`);
      }
    }
  }

  await browser.close();
})();
