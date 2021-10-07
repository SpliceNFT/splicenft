import { default as Confidence } from './ConfidenceInTheMission';
import { default as Garden } from './TheGardenOfEarthlyDelights';
import { default as District1618 } from './District1618';
import { default as Flower } from './Flower';
import { Renderer } from '../types/Renderers';

export const Renderers: Record<string, Renderer> = {
  Flower: Flower,
  'Confidence In the Mission': Confidence,
  'The Garden of Earthly Delights': Garden,
  District1618: District1618
};

export const RendererNames = Object.keys(Renderers);

export * from '../types/Renderers';
