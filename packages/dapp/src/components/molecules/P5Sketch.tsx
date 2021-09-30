import React, { useState } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';

import { RGB } from 'get-rgba-palette';
import { Flex } from '@chakra-ui/react';
import { default as flower } from '../renderers/flower';

export const P5Sketch = (props: {
  dim: { w: number; h: number };
  colors: RGB[];
  onCanvasCreated: (p5: p5Types) => void;
}) => {
  const { dim, colors, onCanvasCreated } = props;

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(dim.w, dim.h).parent(canvasParentRef);
    onCanvasCreated(p5);
  };

  const draw = (p5: p5Types) => {
    flower({ p5, colors, dim });
  };

  return (
    <Flex direction="column">
      <Sketch setup={setup} draw={draw} />
    </Flex>
  );
};
