// Tile stills into one PNG so a whole scene (or week) can be eyeballed at once.
//   node scripts/contact-sheet.mjs out/sheet.png out/a.png out/b.png …   [--cols=2]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

/** @param {string} out @param {string[]} files @param {number} [cols] */
export const contactSheet = async (out, files, cols = 2) => {
  const tiles = files
    .map((f) => {
      const abs = path.resolve(f);
      return `<div style="position:relative"><img src="file://${abs}" style="width:100%;display:block"><span style="position:absolute;left:6px;top:4px;font:600 15px monospace;color:#ff0;background:#000a;padding:1px 6px">${path.basename(f, '.png')}</span></div>`;
    })
    .join('');
  // a file:// page, because about:blank is not allowed to load local images
  const html = path.resolve(out.replace(/\.png$/, '') + '.html');
  fs.writeFileSync(
    html,
    `<body style="margin:0;background:#333;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px">${tiles}</body>`,
  );
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960 * cols, height: 540 } });
  await page.goto(`file://${html}`, { waitUntil: 'load' });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  fs.unlinkSync(html);
  return out;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const cols = Number(args.find((a) => a.startsWith('--cols='))?.slice(7) ?? 2);
  const [out, ...files] = args.filter((a) => !a.startsWith('--'));
  if (!out || files.length === 0) {
    console.error('usage: node scripts/contact-sheet.mjs <out.png> <still.png>… [--cols=2]');
    process.exit(1);
  }
  console.log(await contactSheet(out, files, cols));
}
