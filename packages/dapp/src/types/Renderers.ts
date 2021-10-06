import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';

export interface DrawProps {
  p5: p5Types;
  colors: RGB[];
  dim: { w: number; h: number };
}

export type Renderer = (props: DrawProps) => void;
