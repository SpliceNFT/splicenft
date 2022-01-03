import { RGB } from '..';

export type HistogramEntry = {
  rgb: RGB;
  hex: string;
  freq: number;
};
export type Histogram = HistogramEntry[];
