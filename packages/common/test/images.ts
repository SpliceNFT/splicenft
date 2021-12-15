import { expect } from 'chai';
import { readFileSync } from 'fs';
import { extractColors } from '../src';
describe('Color extraction', function () {
  it('works with unencoded SVG strings #131', async function () {
    const plainSvg = readFileSync('./test/plain.svg', { encoding: 'utf-8' });
    const palette = await extractColors(plainSvg, {});
    expect(palette.length).to.eq(10);
  });

  it('works with base64 encoded SVG strings #136', async function () {
    const b64Svg = readFileSync('./test/svg.b64', { encoding: 'utf-8' });
    const palette = await extractColors(b64Svg, {});
    expect(palette.length).to.eq(4);
  });
});
