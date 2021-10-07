import { Flex } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React from 'react';
import Sketch from 'react-p5';
import { Renderers } from '@splicenft/common';

export const P5Sketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  rendererName: string;
  onCanvasCreated: (p5: p5Types) => void;
}) => {
  const { dim, colors, onCanvasCreated, randomness, rendererName } = props;

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(dim.w, dim.h).parent(canvasParentRef);
    p5.randomSeed(randomness);
    onCanvasCreated(p5);
  };

  const draw = (p5: p5Types) => {
    const renderer = Renderers[rendererName];
    renderer({ p5, colors, dim });
  };

  return (
    <Flex direction="column">
      <Sketch setup={setup} draw={draw} />
    </Flex>
  );
};
