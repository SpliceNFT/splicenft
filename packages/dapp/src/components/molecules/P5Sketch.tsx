import { Flex } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import React from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';

export const P5Sketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  code?: string;
  onSketched?: (dataUrl: string) => void;
}) => {
  const { dim, colors, onSketched, randomness, code } = props;

  let renderer: any;
  const sketch = (p5: P5Instance) => {
    p5.setup = () => {
      console.log('setup');
      p5.randomSeed(randomness);
      p5.pixelDensity(1);
      p5.createCanvas(dim.w, dim.h, p5.P2D);
    };

    p5.updateWithProps = (props) => {
      if (props.code) {
        try {
          renderer = Function(`"use strict";return (${props.code})`)();
        } catch (e: any) {
          console.error(e);
        }
      }
    };
    p5.draw = () => {
      if (!renderer) return;
      // renderer = Function(`"use strict";return (${props.code})`)();
      console.log('drawing');
      renderer({ p5, colors, dim });
      p5.noLoop();
      if (onSketched) {
        const canvas = (p5 as any).canvas as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        onSketched(dataUrl);
      }
    };
  };

  return (
    <Flex direction="column">
      <ReactP5Wrapper sketch={sketch} code={code} />
    </Flex>
  );
};
