import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
const svg = await readFile('assets/brand.svg', 'utf8');
for (const [name, width] of [
  ['icon.png', 1024],
  ['favicon.png', 64],
])
  await writeFile(
    'assets/' + name,
    new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng(),
  );
const foreground = svg
  .replace('<rect width="1024" height="1024" fill="#235846"/>', '')
  .replace('<path d="M262', '<g transform="translate(128 128) scale(.75)"><path d="M262')
  .replace('</svg>', '</g></svg>');
await writeFile('assets/android-icon-foreground.png', new Resvg(foreground).render().asPng());
console.log('Brand assets generated from assets/brand.svg');
