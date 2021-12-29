import { RGB } from './types/RGB';

export function i32ToRGB(i32: number): RGB {
  const ii32 = i32 >>> 0;
  return [ii32 & 0xff, (ii32 >>> 8) & 0xff, (ii32 >>> 16) & 0xff] as RGB;
}

export function rgbToHex(rgb: RGB) {
  return (rgb[2] | (rgb[1] << 8) | (rgb[0] << 16) | (1 << 24))
    .toString(16)
    .slice(1);
}
