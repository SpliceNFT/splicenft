import b64 from 'base64-js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import pica from 'pica';
import { hexToRgb } from './helpers';
import { palette } from './palette';
import { Histogram } from './types/Histogram';
import type { ImageLoader, ImageLoaderOptions } from './types/ImageLoader';

const SVG_DATA_PREFIX = 'data:image/svg+xml;';

const SVG_FILL_REGEX = new RegExp(
  `fill\s*[:=]\s*['"](\#[A-Fa-f0-9]{3,6})['"]`,
  'gi'
);

export const isSVG = (url: string): boolean => {
  return url.startsWith(SVG_DATA_PREFIX);
};

export const extractPaletteFromSvg = (svg: string): Histogram => {
  const matches = svg.matchAll(SVG_FILL_REGEX);

  const ret: Record<string, number> = {};
  for (const match of matches) {
    if (ret[match[1]]) {
      ret[match[1]] = ret[match[1]] + 1;
    } else {
      ret[match[1]] = 1;
    }
  }
  const dominantColors = Object.keys(ret)
    .sort(function (a, b) {
      return ret[b] - ret[a];
    })
    .slice(0, 10);
  const total = dominantColors.reduce((prv, cur) => prv + ret[cur], 0);
  return dominantColors.map((hx: string) => ({
    hex: hx,
    freq: ret[hx] / total,
    rgb: hexToRgb(hx)
  }));
};

const scaleDown = async (
  rgba: Uint8Array,
  dims: { w: number; h: number }
): Promise<number[]> => {
  const scaler = pica();
  const toDim = {
    w: 300,
    h: Math.floor((300 * dims.h) / dims.w)
  };
  const res = scaler.resizeBuffer({
    src: rgba,
    width: dims.w,
    height: dims.h,
    toWidth: toDim.w,
    toHeight: toDim.h
  });
  return res;
};

export const extractPixels = async (
  image: string | HTMLImageElement,
  LoadImage: ImageLoader,
  options: ImageLoaderOptions
): Promise<number[]> => {
  const img = await LoadImage(image, options);

  const scaled = await scaleDown(img.rgb, img.dims);
  return scaled;
};

//todo: consider rendering the SVG on a canvas and extract colors the png way.
export const extractColors = async (
  image: string | HTMLImageElement,
  LoadImage: ImageLoader,
  options: ImageLoaderOptions
): Promise<Histogram> => {
  if (
    (typeof image === 'string' && isSVG(image)) ||
    (typeof image === 'object' && isSVG(image.src))
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
    const img = await LoadImage(image, options);
    if (img.xml) {
      return extractPaletteFromSvg(img.xml);
    }
    const scaled = await scaleDown(img.rgb, img.dims);

    return palette(Array.from(scaled), {
      w: 300,
      h: Math.floor((300 * img.dims.h) / img.dims.w)
    });
    //return palette(Array.from(img.rgb), img.dims);
  }
};

export { LoadImage as LoadImageBrowser } from './browser/LoadImage';
export { GRAYSCALE_HISTOGRAM } from './grayscale';
export { rgbToHex } from './helpers';
export {
  getFileType,
  LoadImage as LoadImageNode,
  readImage
} from './node/LoadImage';
export { Histogram, HistogramEntry } from './types/Histogram';
export { RGB, RGBA } from './types/RGB';
export { palette };

