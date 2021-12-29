import { expect } from 'chai';
import { rgbToHex } from '../src';

it('encodes rgb values as hex', async function () {
  expect(rgbToHex([255, 255, 255])).to.eq('ffffff');
  expect(rgbToHex([255, 128, 0])).to.eq('ff8000');
  expect(rgbToHex([0, 0, 0])).to.eq('000000');
});
