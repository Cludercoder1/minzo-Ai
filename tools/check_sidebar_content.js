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

    const issues = [];

    // Check sidebar width
    const sidebar = await page.$('#sidebar');
    if (!sidebar) { console.log(`${vp.name}: Sidebar not found`); continue; }
    const sb = await sidebar.boundingBox();
    issues.push(`${vp.name}: sidebar width=${sb.width.toFixed(1)} px`);

    // Check nav-text visibility and overflow
    const navTextHandles = await page.$$('.nav-text');
    for (let i = 0; i < navTextHandles.length; i++) {
      const el = navTextHandles[i];
      const visible = await page.evaluate(e => {
        const style = window.getComputedStyle(e);
        return style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity || '1') > 0;
      }, el);
      const rect = await el.boundingBox();
      const overflow = await page.evaluate(e => e.scrollWidth > e.clientWidth, el);
      const text = await page.evaluate(e => e.textContent.trim(), el);
      if (!visible) issues.push(`  [${i}] '${text}' not visible`);
      if (overflow) issues.push(`  [${i}] '${text}' is overflowing (scrollWidth > clientWidth)`);
      // check for ellipsis (text-overflow)
      const textOverflow = await page.evaluate(e => window.getComputedStyle(e).textOverflow, el);
      if (textOverflow && textOverflow !== 'clip' && textOverflow !== 'unset') {
        issues.push(`  [${i}] '${text}' textOverflow=${textOverflow}`);
      }
      if (rect && rect.width < 10) issues.push(`  [${i}] '${text}' too narrow (width=${rect.width.toFixed(1)})`);
    }

    // Check chat list and project list container sizes
    const chats = await page.$$('#chatsList .chat-list-item, #chatsList .nav-item');
    const projects = await page.$$('#projectsList .project-list-item, #projectsList .nav-item');
    if (chats.length === 0) issues.push('  No chat items found (might be empty)');
    // check first chat name width
    if (chats.length > 0) {
      const first = chats[0];
      const overflow = await page.evaluate(e => e.scrollWidth > e.clientWidth, first);
      if (overflow) issues.push(`  first chat item overflowing`);
    }

    // Check for any elements set to overflow hidden in sidebar (could clip items)
    const overflowHidden = await page.evaluate(() => {
      const nodes = document.querySelectorAll('#sidebar *');
      const list = [];
      nodes.forEach(n => {
        const style = window.getComputedStyle(n);
        if (/(hidden|clip)/.test(style.overflow)) {
          list.push({ tag: n.tagName, class: n.className, overflow: style.overflow });
        }
      });
      return list.slice(0, 20);
    });
    if (overflowHidden.length) {
      issues.push(`  Elements with overflow:hidden or clip: ${JSON.stringify(overflowHidden)}`);
    }

    if (issues.length === 1) { // only header about sidebar width
      console.log(`${vp.name}: OK — ${issues[0]}`);
    } else {
      console.log(`${vp.name}: Issues found:`);
      issues.forEach(i => console.log(i));
    }
  }

  await browser.close();
})();
