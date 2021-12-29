import { RGB } from '..';

export type Histogram = Array<{
  rgb: RGB;
  hex: string;
  freq: number;
}>;
