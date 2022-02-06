import { rgbToHex } from './helpers';
import { Histogram } from './types/Histogram';
import { RGB } from './types/RGB';

export const GRAYSCALE_COLORS: RGB[] = [
  [20, 20, 20],
  [125, 125, 125],
  [250, 250, 250],
  [220, 220, 220],
  [200, 200, 200],
  [170, 170, 170],
  [80, 80, 80],
  [150, 150, 150],
  [40, 40, 40],
  [100, 100, 100]
];

export const GRAYSCALE_HISTOGRAM: Histogram = GRAYSCALE_COLORS.map(
  (rgb: RGB) => ({
    rgb,
    hex: `#${rgbToHex(rgb)}`,
    freq: 0.1
  })
);
