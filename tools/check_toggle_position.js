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
    const toggle = await page.$('#sidebarToggle');

    if (!sidebar || !toggle) {
      console.log(`${vp.name}: toggle or sidebar not found`);
      continue;
    }

    // Measure expanded state
    let sb = await sidebar.boundingBox();
    let tb = await toggle.boundingBox();

    if (!sb || !tb) {
      console.log(`${vp.name}: bounding boxes not found`);
      continue;
    }

    let sbCenterY = sb.y + sb.height / 2;
    let tbCenterY = tb.y + tb.height / 2;

    let verticalOffset = tbCenterY - sbCenterY;
    let expectedLeft = sb.x + sb.width;
    let toggleLeft = tb.x;
    let leftOffset = toggleLeft - expectedLeft;

    console.log(`${vp.name} (expanded): sidebar width=${sb.width.toFixed(1)}, toggle.x=${tb.x.toFixed(1)}, leftOffset=${leftOffset.toFixed(1)}, verticalOffset=${verticalOffset.toFixed(1)}, toggle.width=${tb.width.toFixed(1)}`);

    // Toggle collapsed state and measure again
    await page.evaluate(() => document.querySelector('#sidebar').classList.add('collapsed'));
    await new Promise(r => setTimeout(r, 200));

    sb = await sidebar.boundingBox();
    tb = await toggle.boundingBox();

    if (!sb || !tb) {
      console.log(`${vp.name}: bounding boxes not found after collapse`);
      continue;
    }

    sbCenterY = sb.y + sb.height / 2;
    tbCenterY = tb.y + tb.height / 2;

    verticalOffset = tbCenterY - sbCenterY;
    expectedLeft = sb.x + sb.width;
    toggleLeft = tb.x;
    leftOffset = toggleLeft - expectedLeft;

    console.log(`${vp.name} (collapsed): sidebar width=${sb.width.toFixed(1)}, toggle.x=${tb.x.toFixed(1)}, leftOffset=${leftOffset.toFixed(1)}, verticalOffset=${verticalOffset.toFixed(1)}, toggle.width=${tb.width.toFixed(1)}`);

    // Remove the collapsed class for next viewport
    await page.evaluate(() => document.querySelector('#sidebar').classList.remove('collapsed'));
  }

  await browser.close();
})();
