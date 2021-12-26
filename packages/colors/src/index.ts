import { default as paletteOld, RGB } from 'get-rgba-palette';
import type { ImageLoader } from './types/ImageLoader';

import { default as hexRgb } from 'hex-rgb';
import b64 from 'base64-js';
import { palette } from './palette';

const SVG_DATA_PREFIX = 'data:image/svg+xml;';

const SVG_FILL_REGEX = new RegExp(
  `fill\s*[:=]\s*['"](\#[A-Fa-f0-9]{6})['"]`,
  'gi'
);

export const extractPaletteFromSvg = (svg: string): RGB[] => {
  const matches = svg.matchAll(SVG_FILL_REGEX);

  const ret: Record<string, number> = {};
  for (const match of matches) {
    if (ret[match[1]]) {
      ret[match[1]] = ret[match[1]] + 1;
    } else {
      ret[match[1]] = 1;
    }
  }
  return Object.keys(ret)
    .sort(function (a, b) {
      return ret[b] - ret[a];
    })
    .slice(0, 10)
    .map((hx): RGB => hexRgb(hx, { format: 'array' }).slice(0, 3) as RGB);
};

/// the old implementation
/// @deprecated
export const extractPaletteOld = (flatPixels: number[] | Uint8Array): RGB[] => {
  return paletteOld(flatPixels, 10);
};

export const extractPalette = async (flatPixels: number[]): Promise<RGB[]> => {
  const result = palette({
    saturationWeight: 0,
    distance: 0.2,
    pixels: flatPixels.length / 4,
    accuracy: 12
  })(flatPixels);
  //console.log(result);
  return result.map((c) => [c.red, c.green, c.blue]); //.slice(0, 10);
};

export const extractColors = async (
  image: string | HTMLImageElement,
  GetPixels: ImageLoader,
  options: {
    proxy?: string;
  }
): Promise<RGB[]> => {
  if (
    (typeof image === 'string' && image.startsWith(SVG_DATA_PREFIX)) ||
    (typeof image === 'object' && image.src.startsWith(SVG_DATA_PREFIX))
  ) {
    let dataUrl = decodeURIComponent(
      typeof image === 'string' ? image : image.src
    );
    dataUrl = dataUrl.replace(SVG_DATA_PREFIX, '');
    if (dataUrl.startsWith('base64,')) {
      const arr = b64.toByteArray(dataUrl.replace('base64,', ''));
      dataUrl = new TextDecoder().decode(arr);
    }
    return extractPaletteFromSvg(dataUrl);
  } else {
    const px = await GetPixels(image, options);
    return extractPalette(Array.from(px));
  }
};

export { LoadImage as LoadImageBrowser } from './browser/LoadImage';
export {
  LoadImage as LoadImageNode,
  readImage,
  getFileType
} from './node/LoadImage';
export { palette };
