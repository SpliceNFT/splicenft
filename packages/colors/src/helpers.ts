import { RGB } from './types/RGB';

export function i32ToRGB(i32: number): RGB {
  const ii32 = i32 >>> 0;
  return [ii32 & 0xff, (ii32 >>> 8) & 0xff, (ii32 >>> 16) & 0xff] as RGB;
}
