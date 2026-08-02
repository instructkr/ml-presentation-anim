// Quick functional check of /editor.html against a `vite preview` build.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5199';
const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

await page.goto(`${BASE}/editor.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

check('editor page loads with React Flow canvas', (await page.locator('.react-flow').count()) > 0);
const sidebarItems = await page.getByText('moe-arch', { exact: false }).count();
check('sidebar lists diagrams (moe-arch visible)', sidebarItems > 0);

const nodeCount = await page.locator('.react-flow__node').count();
check('nodes rendered on canvas', nodeCount >= 10, `${nodeCount} nodes`);

// drag the first block node by 80,40
const node = page.locator('.react-flow__node').last();
const box = await node.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
}
check('node drag executed', Boolean(box));

// export
await page.locator('button', { hasText: 'Export TS' }).first().click();
await page.waitForTimeout(400);
const ta = page.locator('textarea');
const exported = (await ta.count()) > 0 ? await ta.first().inputValue() : '';
check('export produces defineDiagram source', exported.includes('defineDiagram'));
check('export bakes positions', (exported.match(/position: \{ x: -?\d+, y: -?\d+ \}/g) ?? []).length >= 10);
check('export preserves Korean labels', exported.includes('입력 토큰'));
check('export escapes tex backslashes', exported.includes('\\\\mathrm'));

await page.screenshot({ path: 'out/e2e/editor.png' });
check('no page/console errors', errors.length === 0, errors.join(' | '));

console.log(results.join('\n'));
console.log('\n--- export head ---\n' + exported.split('\n').slice(0, 14).join('\n'));
await browser.close();
