import { HistogramEntry, RGB } from '@splicenft/colors';
import { default as p5, default as p5Types } from 'p5';
import { NFTTrait } from '..';
import { OriginFeatures } from './TransferObjects';

export const BANNER_DIMS = { w: 1500, h: 500 };

type P5HistogramEntry = HistogramEntry & {
  color: p5.Color;
};

export interface DrawArgs {
  dim: { w: number; h: number };
  params: OriginFeatures;
}

export interface DrawProps extends DrawArgs {
  p5: p5Types;
  colors: RGB[];
  params: OriginFeatures & {
    colors: Array<P5HistogramEntry>;
  };
}

export type Renderer = (props: DrawProps) => NFTTrait[] | void;
