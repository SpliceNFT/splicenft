import { RGB } from '@splicenft/colors';
import p5 from 'p5';
import p5Types from 'p5';
import { HistogramEntry } from '@splicenft/colors';

type P5HistogramEntry = HistogramEntry & {
  color: p5.Color;
};

export interface DrawProps {
  p5: p5Types;
  colors: RGB[];
  dim: { w: number; h: number };
  params?: {
    randomness: number;
    colors: Array<P5HistogramEntry>;
  };
}

export type Renderer = (props: DrawProps) => void;
