import { default as Confidence } from './ConfidenceInTheMission';
import { default as Garden } from './TheGardenOfEarthlyDelights';
import { default as Flower } from './Flower';
import { Renderer } from '../../types/Renderers';

const Renderers: Record<string, Renderer> = {
  Flower: Flower,
  'Confidence In the Mission': Confidence,
  'The Garden of Earthly Delights': Garden
};

export default Renderers;
export const RendererNames = Object.keys(Renderers);
