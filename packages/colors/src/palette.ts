import * as iq from 'image-q';
import { i32ToRGB } from './helpers';
import { RGB } from './types/RGB';

export function palette(
  rgba: number[],
  dims: { w: number; h: number },
  amount = 10
): RGB[] {
  const pointContainer = iq.utils.PointContainer.fromUint8Array(
    rgba,
    dims.w,
    dims.h
  );
  const distanceCalculator = new iq.distance.EuclideanBT709NoAlpha();
  const paletteQuantizer = new iq.palette.WuQuant(distanceCalculator, amount);
  paletteQuantizer.sample(pointContainer);
  const qPalette = paletteQuantizer.quantizeSync();

  const quantizedImage = iq.applyPaletteSync(pointContainer, qPalette, {
    colorDistanceFormula: 'euclidean-bt709-noalpha',
    imageQuantization: 'nearest'
  });

  const histogram = new iq.palette.ColorHistogram(2, amount);
  histogram.sample(quantizedImage);
  return histogram.getImportanceSortedColorsIDXI32().map(i32ToRGB);
}
