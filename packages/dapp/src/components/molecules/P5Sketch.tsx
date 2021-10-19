import { Flex } from '@chakra-ui/react';
import { Renderers } from '@splicenft/common';
import { RGB } from 'get-rgba-palette';
import React from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';

export const P5Sketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  rendererName: string;
  onSketched: ({ dataUrl, blob }: { dataUrl: string; blob?: Blob }) => void;
}) => {
  const { dim, colors, onSketched, randomness, rendererName } = props;

  const sketch = (p5: P5Instance) => {
    let renderer = Renderers[rendererName];

    p5.setup = () => {
      p5.randomSeed(randomness);
      p5.createCanvas(dim.w, dim.h, p5.P2D);
    };

    p5.updateWithProps = (props) => {
      console.log(props);
      if (props.rendererName) {
        renderer = Renderers[rendererName];
      }
    };
    p5.draw = () => {
      renderer({ p5, colors, dim });

      const canvas = (p5 as any).canvas as HTMLCanvasElement;
      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          onSketched({
            blob,
            dataUrl
          });
        },
        'image/png',
        100
      );
    };
  };

  return (
    <Flex direction="column">
      <ReactP5Wrapper sketch={sketch} rendererName={rendererName} />;
    </Flex>
  );
};
