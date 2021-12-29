import { expect } from 'chai';
import { readFileSync } from 'fs';
import { extractColors, LoadImageNode } from '../src';

describe('Color extraction', function () {
  it('works with unencoded SVG strings #131', async function () {
    const plainSvg = readFileSync('./test/plain.svg', { encoding: 'utf-8' });
    const palette = await extractColors(plainSvg, LoadImageNode, {});
    expect(palette.length).to.eq(10);
  });

  it('works with base64 encoded SVG strings #136', async function () {
    const b64Svg = readFileSync('./test/svg.b64', { encoding: 'utf-8' });
    const palette = await extractColors(b64Svg, LoadImageNode, {});
    expect(palette.length).to.eq(4);
  });

  it('works with nft pfp images #153', async function () {
    const palette = await extractColors(
      './test/flyfrog.png',
      LoadImageNode,
      {}
    );
    expect(palette.length).to.eq(10);
    expect(palette[0].hex).to.eq('fe1929');
  });
});
