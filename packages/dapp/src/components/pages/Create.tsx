import {
  Button,
  Center,
  Container,
  Flex,
  Heading,
  Text,
  Textarea
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { CreativeOrigin } from '../../types/CreativeOrigin';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { P5Sketch } from '../molecules/P5Sketch';
import { NFTChooser } from '../organisms/NFTChooser';

export const CreatePage = () => {
  const [code, setCode] = useState<string>();

  const [origin, setOrigin] = useState<CreativeOrigin>();

  const updateCode = () => {
    const $el: HTMLTextAreaElement = document.getElementById(
      'codearea'
    ) as HTMLTextAreaElement;
    setCode($el.value);
  };

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      <Heading>Test your Splice artwork styles</Heading>
      <Heading size="sm" color="gray.400">
        Use this to validate your style code
      </Heading>
      <Flex my={6} gridGap={6}>
        <Flex flex="2" w="full">
          <NFTChooser nftChosen={setOrigin} />
        </Flex>
      </Flex>
      {origin && (
        <Flex my={4} align="center" gridGap={3}>
          <Flex flex="1">
            <DominantColorsDisplay colors={origin.histogram} />
          </Flex>
          <Flex flex="1">
            <Text>
              <strong>Random seed: </strong>
              {origin.randomness}
            </Text>
          </Flex>
        </Flex>
      )}
      <Textarea
        id="codearea"
        name="codearea"
        fontFamily="mono"
        placeholder="your code goes here"
        bg="white"
        rows={20}
      >{`function ({ p5, params, dim }) {
  const { colors } = params;
  let y = dim.h;
  
  for (let color of colors) {
    p5.fill(color.color);
    p5.strokeWeight(0);
    let newY = y - color.freq * dim.h;
    p5.rect(0,newY,dim.w,y);
    y = newY;
  }
}`}</Textarea>
      <Flex my={4}>
        <Button onClick={updateCode} variant="black" disabled={!origin}>
          update
        </Button>
      </Flex>
      {code && origin && (
        <Center
          width="100%"
          height="100%"
          position="relative"
          background="green.300"
        >
          <P5Sketch
            code={code}
            randomness={origin.randomness}
            dim={{ w: 1500, h: 500 }}
            colors={origin.histogram}
          />
        </Center>
      )}
    </Container>
  );
};
