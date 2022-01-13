import { Flex, useToast } from '@chakra-ui/react';
import { Histogram } from '@splicenft/colors';
import React from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';

export const P5Sketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: Histogram;
  code?: string;
  onSketched?: (dataUrl: string) => void;
}) => {
  const { dim, colors, onSketched, randomness, code } = props;
  const toast = useToast();
  let renderer: any;
  const sketch = (p5: P5Instance) => {
    p5.setup = () => {
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
          toast({
            status: 'warning',
            title: e.message
          });
        }
      }
    };
    p5.draw = () => {
      if (!renderer) return;
      const params = {
        randomness,
        colors: colors.map((c) => ({
          color: p5.color(c.hex),
          ...c
        }))
      };
      try {
        p5.noLoop();
        //the most important line in Splice:
        renderer({ p5, colors: colors.map((c) => c.rgb), dim, params });
        if (onSketched) {
          const canvas = (p5 as any).canvas as HTMLCanvasElement;
          const dataUrl = canvas.toDataURL('image/png');
          onSketched(dataUrl);
        }
      } catch (e: any) {
        console.error(e);
      }
    };
  };

  return (
    <Flex direction="column">
      <ReactP5Wrapper sketch={sketch} code={code} />
    </Flex>
  );
};
