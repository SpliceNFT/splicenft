import * as iq from 'image-q';
import { PointContainer } from 'image-q/dist/esm/utils';
import { Histogram } from '.';
import { i32ToRGB, rgbToHex } from './helpers';

const histogram = (pc: PointContainer): Array<[string, number]> => {
  const p = pc.toUint32Array();
  const buckets: Record<number, number> = {};

  for (let i = 0; i < p.length; i++) {
    if (!buckets[p[i]]) {
      buckets[p[i]] = 0;
    }
    buckets[p[i]]++;
  }
  return Object.entries(buckets).sort(([, a], [, b]) => b - a);
};

export function palette(
  rgba: number[],
  dims: { w: number; h: number },
  amount = 10
): Histogram {
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

  //const histogram = new iq.palette.ColorHistogram(2, amount);
  //histogram.sample(quantizedImage);
  //const iqH = histogram.getImportanceSortedColorsIDXI32().map(i32ToRGB);
  //console.log('iqh', iqH);

  const buckets = histogram(quantizedImage);
  const len = quantizedImage.getPointArray().length;
  return buckets.map((b) => {
    const rgb = i32ToRGB(+b[0]);
    return {
      rgb,
      hex: rgbToHex(rgb),
      freq: b[1] / len
    };
  });
}
