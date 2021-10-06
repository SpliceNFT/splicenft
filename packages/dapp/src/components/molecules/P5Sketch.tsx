import { Flex } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React from 'react';
import Sketch from 'react-p5';
import { default as Confidence } from '../renderers/ConfidenceInTheMission';
import { default as Garden } from '../renderers/TheGardenOfEarthlyDelights';
import { default as Flower } from '../renderers/Flower';
export const P5Sketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  onCanvasCreated: (p5: p5Types) => void;
}) => {
  const { dim, colors, onCanvasCreated, randomness } = props;

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(dim.w, dim.h).parent(canvasParentRef);
    p5.randomSeed(randomness);
    onCanvasCreated(p5);
  };

  const draw = (p5: p5Types) => {
    Garden({ p5, colors, dim });
  };

  return (
    <Flex direction="column">
      <Sketch setup={setup} draw={draw} />
    </Flex>
  );
};
