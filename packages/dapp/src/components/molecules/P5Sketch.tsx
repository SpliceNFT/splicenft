import { Flex, useToast } from '@chakra-ui/react';
import { DrawArgs, DrawProps, NFTTrait } from '@splicenft/common';
import deepEqual from 'deep-equal';
import React, { useMemo } from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';

const P5SketchDrawer = (props: {
  drawArgs: DrawArgs;
  code: string;
  onSketched?: (dataUrl: string, traits: NFTTrait[]) => void;
}) => {
  const { drawArgs, onSketched, code } = props;

  const toast = useToast();

  const renderer = useMemo(() => {
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
      p5.randomSeed(drawArgs.params.randomness);
      p5.pixelDensity(1);
      p5.createCanvas(drawArgs.dim.w, drawArgs.dim.h, p5.P2D);
    };

    p5.draw = () => {
      if (!renderer) return;
      const drawProps: DrawProps = {
        ...drawArgs,
        p5,
        colors: drawArgs.params.colors.map((c) => c.rgb),
        params: {
          ...drawArgs.params,
          colors: drawArgs.params.colors.map((c) => ({
            color: p5.color(c.hex),
            ...c
          }))
        }
      };

      try {
        p5.noLoop();

        //the most important line in Splice:
        const _traits = renderer(drawProps);

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
  if (oldP.code !== nextP.code) return false;
  //return false if we need to rerender
  return deepEqual(oldP.drawArgs, nextP.drawArgs);
});
