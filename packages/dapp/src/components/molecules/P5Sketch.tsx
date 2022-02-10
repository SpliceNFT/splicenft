import { Flex, useToast } from '@chakra-ui/react';
import { Histogram } from '@splicenft/colors';
import { NFTTrait } from '@splicenft/common';
import React, { useMemo } from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';

export const BANNER_DIMS = { w: 1500, h: 500 };

const P5SketchDrawer = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: Histogram;
  code: string;
  onSketched?: (dataUrl: string, traits: NFTTrait[]) => void;
}) => {
  const { dim, colors, onSketched, randomness, code } = props;
  const toast = useToast();

  const renderer = useMemo(() => {
    console.log('new renderer');
    try {
      const _renderer = Function(`"use strict";return (${props.code})`)();
      return _renderer;
    } catch (e: any) {
      console.error(e);
      toast({
        status: 'warning',
        title: e.message
      });
    }
  }, [code]);

  const sketch = (p5: P5Instance) => {
    p5.setup = () => {
      p5.randomSeed(randomness);
      p5.pixelDensity(1);
      p5.createCanvas(dim.w, dim.h, p5.P2D);
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
        const _traits = renderer({
          p5,
          colors: colors.map((c) => c.rgb),
          dim,
          params
        });
        if (onSketched) {
          const canvas = (p5 as any).canvas as HTMLCanvasElement;
          const dataUrl = canvas.toDataURL('image/png');
          const traits: NFTTrait[] =
            _traits && _traits.length && _traits.length > 0 ? _traits : [];
          onSketched(dataUrl, traits);
        }
      } catch (e: any) {
        console.error(e);
      }
    };
  };

  return (
    <Flex direction="column">
      <ReactP5Wrapper sketch={sketch} />
    </Flex>
  );
};

export const P5Sketch = React.memo(P5SketchDrawer, (oldP, nextP) => {
  const propsToCheck = ['code', 'dim', 'randomness', 'colors'];
  for (const check of propsToCheck) {
    //@ts-ignore
    if (oldP[check] !== nextP[check]) {
      return false;
    }
  }
  return true;
});
