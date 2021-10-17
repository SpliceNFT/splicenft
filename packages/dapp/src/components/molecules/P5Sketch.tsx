import { Flex } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React, { useEffect, useState } from 'react';
import { ReactP5Wrapper, P5Instance } from 'react-p5-wrapper';
import { Renderers } from '@splicenft/common';

export const P5Sketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  rendererName: string;
  onCanvasCreated: (p5: P5Instance) => void;
}) => {
  const { dim, colors, onCanvasCreated, randomness, rendererName } = props;
  const [__p5, setP5] = useState<P5Instance>();

  useEffect(() => {
    if (!__p5) return;
    //onCanvasCreated(__p5);
  }, [__p5]);

  const sketch = (p5: P5Instance) => {
    let renderer = Renderers[rendererName];

    p5.setup = () => {
      p5.randomSeed(randomness);
      p5.createCanvas(dim.w, dim.h, p5.P2D);
      //
    };

    p5.updateWithProps = (props) => {
      if (props.rendererName) {
        renderer = Renderers[rendererName];
      }
    };
    p5.draw = () => {
      console.log('draw', rendererName);
      renderer({ p5, colors, dim });
    };
    setP5(p5);
    //onCanvasCreated(p5);
  };

  return (
    <Flex direction="column">
      <ReactP5Wrapper sketch={sketch} rendererName={rendererName} />;
    </Flex>
  );
};
