import { expect } from 'chai';
import { rgbHex } from '../src';

it('encodes rgb values as hex', async function () {
  expect(rgbHex(255, 255, 255)).to.eq('ffffff');
  expect(rgbHex(255, 128, 0)).to.eq('ff8000');
  expect(rgbHex(0, 0, 0)).to.eq('000000');
});
