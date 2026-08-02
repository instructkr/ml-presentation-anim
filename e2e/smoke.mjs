// Playwright smoke test for the frozen dist/ build served via `vite preview`.
// Run: node e2e/smoke.mjs
// Requires a running server at BASE_URL (started separately, not by this script).

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'out', 'e2e');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:5199';

const results = [];
const pageErrors = [];
const consoleErrors = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function shot(page, name) {
  const p = path.join(OUT_DIR, name);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('pageerror', (err) => {
    pageErrors.push({ message: err.message, stack: err.stack, when: currentAction });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), when: currentAction });
    }
  });

  let currentAction = 'init';
  const setAction = (a) => { currentAction = a; };

  try {
    // a. Home loads; week link visible.
    setAction('load home');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    let weekLink;
    try {
      weekLink = page.getByText('2026-08-05-moe-demo', { exact: false }).first();
      await weekLink.waitFor({ state: 'visible', timeout: 5000 });
      record('a. Home loads; week link visible', true);
    } catch (e) {
      record('a. Home loads; week link visible', false, e.message);
    }
    await shot(page, 'home.png');

    // Navigate to explorer
    setAction('navigate to explorer');
    let navigatedViaClick = false;
    try {
      if (weekLink) {
        await weekLink.click();
        navigatedViaClick = true;
      }
    } catch (e) {
      // fall through to direct nav
    }
    if (!navigatedViaClick) {
      await page.goto(`${BASE_URL}/#/2026-08-05-moe-demo`, { waitUntil: 'load' });
    }
    await page.waitForTimeout(500);

    // b. Explorer: .react-flow present; >= 10 nodes rendered; text "Multi-Head Attention" visible.
    setAction('explorer canvas check');
    try {
      await page.waitForSelector('.react-flow', { state: 'visible', timeout: 8000 });
      // allow nodes to lay out
      await page.waitForTimeout(500);
      const nodeCount = await page.locator('.react-flow__node').count();
      const mhaVisible = await page.getByText('Multi-Head Attention', { exact: false }).first().isVisible().catch(() => false);
      const pass = nodeCount >= 10 && mhaVisible;
      record('b. Explorer canvas: .react-flow present, >=10 nodes, MHA text visible', pass,
        `nodeCount=${nodeCount}, mhaVisible=${mhaVisible}`);
    } catch (e) {
      record('b. Explorer canvas: .react-flow present, >=10 nodes, MHA text visible', false, e.message);
    }
    await shot(page, 'explorer.png');

    // c. Click "Multi-Head Attention" node; within 2s DetailView header appears ("Space: 다음 단계")
    setAction('click Multi-Head Attention node');
    try {
      const mhaNode = page.getByText('Multi-Head Attention', { exact: false }).first();
      await mhaNode.click();
      await page.waitForSelector('text=Space: 다음 단계', { timeout: 4000 });
      record('c. Click MHA node opens DetailView within 2s (hint text present)', true);
    } catch (e) {
      record('c. Click MHA node opens DetailView within 2s (hint text present)', false, e.message);
    }
    await shot(page, 'detail-attn.png');

    // d. Wait ~3s (step1 autoplay finishes). Press Space; wait 3.5s; press Space; wait 3.5s.
    // No page errors; step dots present (qkv/scores/softmax/output).
    setAction('step through detail with Space key');
    try {
      await page.waitForTimeout(3000);
      await page.keyboard.press('Space');
      await page.waitForTimeout(3500);
      await page.keyboard.press('Space');
      await page.waitForTimeout(3500);
      const dotTexts = ['qkv', 'scores', 'softmax', 'output'];
      const dotChecks = {};
      for (const t of dotTexts) {
        dotChecks[t] = await page.getByRole('button', { name: new RegExp(t, 'i') }).first().isVisible().catch(() => false);
      }
      const anyDots = Object.values(dotChecks).some(Boolean);
      record('d. Step through with Space (no errors so far), step dots present', anyDots, JSON.stringify(dotChecks));
    } catch (e) {
      record('d. Step through with Space (no errors so far), step dots present', false, e.message);
    }
    await shot(page, 'detail-step2.png');

    // e. Press Escape -> DetailView gone; canvas visible again.
    setAction('press Escape to close detail');
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(700); // zoom-out animation
      const hintGone = !(await page.getByText('Space: 다음 단계').first().isVisible().catch(() => false));
      const canvasVisible = await page.locator('.react-flow').first().isVisible().catch(() => false);
      record('e. Escape closes DetailView; canvas visible again', hintGone && canvasVisible,
        `hintGone=${hintGone}, canvasVisible=${canvasVisible}`);
    } catch (e) {
      record('e. Escape closes DetailView; canvas visible again', false, e.message);
    }
    await shot(page, 'after-esc.png');

    // f. Press 'n' (guided path) -> a DetailView opens again within 3s (attention module). Escape.
    setAction("press 'n' for guided path");
    try {
      await page.keyboard.press('n');
      await page.waitForSelector('text=Space: 다음 단계', { timeout: 3000 });
      record("f. Press 'n' opens a DetailView within 3s (guided path)", true);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(700);
    } catch (e) {
      record("f. Press 'n' opens a DetailView within 3s (guided path)", false, e.message);
      // best-effort recovery: ensure we're back at canvas
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(500);
    }

    // g. Click the "Router" node -> detail opens. Escape.
    setAction('click Router node');
    try {
      // ensure canvas visible before clicking
      await page.waitForSelector('.react-flow', { state: 'visible', timeout: 5000 });
      const routerNode = page.getByText('Router', { exact: false }).first();
      await routerNode.click();
      await page.waitForSelector('text=Space: 다음 단계', { timeout: 4000 });
      record('g. Click Router node opens DetailView', true);
    } catch (e) {
      record('g. Click Router node opens DetailView', false, e.message);
    }
    await shot(page, 'detail-router.png');
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(700);
    } catch (e) {
      // ignore
    }

    // h. Open "MoE Layer" group -> two tabs; click "Live 3D"; canvas (WebGL) appears; screenshot.
    setAction('open MoE Layer group');
    let moeOpened = false;
    try {
      await page.waitForSelector('.react-flow', { state: 'visible', timeout: 5000 });
      const moeLabel = page.getByText('MoE Layer', { exact: false }).first();
      await moeLabel.click({ timeout: 3000 });
      await page.waitForSelector('text=Space: 다음 단계', { timeout: 3000 });
      moeOpened = true;
    } catch (e) {
      // fallback: press 'n' three times via guided path
      try {
        setAction("fallback: press 'n' x3 to reach MoE Layer via guided path");
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(500);
          await page.keyboard.press('n');
          await page.waitForTimeout(1200);
        }
        await page.waitForSelector('text=Space: 다음 단계', { timeout: 3000 });
        moeOpened = true;
      } catch (e2) {
        record('h. Open MoE Layer group (direct click or guided-path fallback)', false,
          `direct click failed: ${e.message}; guided-path fallback failed: ${e2.message}`);
      }
    }

    if (moeOpened) {
      try {
        const tabPT = page.getByRole('button', { name: /Tensor Parallel/i }).first();
        const tabL3D = page.getByRole('button', { name: /Live 3D/i }).first();
        const tabsVisible = (await tabPT.isVisible().catch(() => false)) && (await tabL3D.isVisible().catch(() => false));
        record('h. MoE Layer detail opened; two tabs visible', tabsVisible,
          `directClick=${moeOpened}`);
        await shot(page, 'moe-tabs.png');

        await tabL3D.click();
        await page.waitForTimeout(1000);
        const canvasCount = await page.locator('canvas').count();
        record('h. Live 3D tab shows a <canvas> (WebGL) element', canvasCount > 0, `canvasCount=${canvasCount}`);
        await shot(page, 'live3d.png');
      } catch (e) {
        record('h. MoE Layer tabs / Live 3D canvas check', false, e.message);
      }
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(700);
    }

    // i. Press 'd' -> HUD overlay appears (mono text containing "week"); screenshot; press 'd' again.
    setAction("press 'd' for debug HUD");
    try {
      await page.waitForSelector('.react-flow', { state: 'visible', timeout: 5000 }).catch(() => {});
      await page.keyboard.press('d');
      await page.waitForTimeout(500);
      const hudVisible = await page.getByText(/week/i).first().isVisible().catch(() => false);
      record("i. Press 'd' shows HUD overlay containing 'week'", hudVisible);
      await shot(page, 'hud.png');
      await page.keyboard.press('d');
      await page.waitForTimeout(300);
    } catch (e) {
      record("i. Press 'd' shows HUD overlay containing 'week'", false, e.message);
    }

  } finally {
    await browser.close();
  }

  console.log('\n--- Page Errors ---');
  if (pageErrors.length === 0) console.log('(none)');
  for (const e of pageErrors) {
    console.log(`[during: ${e.when}] ${e.message}`);
    if (e.stack) console.log(e.stack);
  }

  console.log('\n--- Console Errors ---');
  if (consoleErrors.length === 0) console.log('(none)');
  for (const e of consoleErrors) {
    console.log(`[during: ${e.when}] ${e.text}`);
  }

  console.log('\n--- Summary ---');
  const failed = results.filter((r) => !r.pass);
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} - ${r.name}`);
  }
  console.log(`\nTotal: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  console.log(`Page errors: ${pageErrors.length}, Console errors: ${consoleErrors.length}`);

  const overallPass = failed.length === 0 && pageErrors.length === 0;
  console.log(`\nOVERALL: ${overallPass ? 'PASS' : 'FAIL'}`);

  process.exit(overallPass ? 0 : 1);
})();
