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

export function hexToRgb(hex: string): RGB {
  hex = hex.replace(/^#/, '');

  if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }

  if (hex.length === 4) {
    hex = hex.slice(0, 3);
  }

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const number = Number.parseInt(hex, 16);
  const red = number >> 16;
  const green = (number >> 8) & 255;
  const blue = number & 255;

  return [red, green, blue];
}
