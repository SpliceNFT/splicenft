import { Button, Container, Flex, Textarea } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import React, { useState } from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';

const PreviewSketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  code: string;
}) => {
  const { dim, colors, randomness, code } = props;
  let renderer: any;

  const sketch = (p5: P5Instance) => {
    p5.setup = () => {
      p5.randomSeed(randomness);
      p5.pixelDensity(1);
      p5.createCanvas(dim.w, dim.h, p5.P2D);
    };

    p5.updateWithProps = (props) => {
      if (props.code) {
        renderer = Function(`"use strict";return (${props.code})`)();
      }
    };
    p5.draw = () => {
      renderer({ p5, colors, dim });
    };
  };

  return (
    <Flex direction="column">
      <ReactP5Wrapper sketch={sketch} code={code} />
    </Flex>
  );
};

export const CreatePage = () => {
  const [code, setCode] = useState<string>();

  const save = () => {
    const $el: HTMLTextAreaElement = document.getElementById(
      'codearea'
    ) as HTMLTextAreaElement;
    setCode($el.value);
  };

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      <Textarea
        id="codearea"
        name="codearea"
        fontFamily="mono"
        placeholder="your code goes here"
        bg="white"
        rows={20}
      ></Textarea>
      <Button
        onClick={() => {
          save();
        }}
      >
        Save
      </Button>
      {code && (
        <PreviewSketch
          code={code}
          randomness={2}
          dim={{ w: 1500, h: 500 }}
          colors={[
            [255, 128, 0],
            [128, 255, 0],
            [0, 128, 255],
            [0, 255, 128]
          ]}
        />
      )}
    </Container>
  );
};
