import {
  Button,
  Container,
  Flex,
  Heading,
  Link,
  Spacer,
  Text,
  Textarea
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { CreativeOrigin } from '../../types/CreativeOrigin';
import { FallbackImage } from '../atoms/FallbackImage';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { P5Sketch } from '../molecules/P5Sketch';
import { PreviewBase } from '../molecules/PreviewBase';
import { NFTChooser } from '../organisms/NFTChooser';
import { FaPlay } from 'react-icons/fa';

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
      <Heading size="lg">Test your Splice artwork styles</Heading>
      <Text fontSize="md" color="gray.500">
        Use this to validate your style code
      </Text>
      <Flex my={6} gridGap={6} flex="2" w="full">
        <NFTChooser nftChosen={setOrigin} />
      </Flex>
      {origin && (
        <Flex my={4} align="center" gridGap={3}>
          <DominantColorsDisplay colors={origin.histogram} showDetails />
        </Flex>
      )}
      <Flex direction="row" align="center" mt={12} mb={3}>
        <Text fontSize="lg" fontWeight="bold">
          Write / paste your code here
        </Text>
        <Spacer />
        <Link isExternal href="https://splicenft.github.io/splicenft/artists/">
          Help
        </Link>
      </Flex>
      <Textarea
        id="codearea"
        name="codearea"
        fontFamily="mono"
        placeholder="your code goes here"
        bg="white"
        rows={20}
        defaultValue={`function ({ p5, params, dim }) {
  // all your code must go inside this function.
  const { colors } = params;
  let y = dim.h;
  for (let color of colors) {
    // colors[].color is a p5 color
    p5.fill(color.color);
    p5.strokeWeight(0);
    y = y - color.freq * dim.h;
    p5.rect(0,y,dim.w, color.freq * dim.h);
  }
}`}
      ></Textarea>
      <Flex my={4} justify="flex-end">
        <Button
          onClick={updateCode}
          variant="black"
          disabled={!origin}
          leftIcon={<FaPlay />}
        >
          Run code
        </Button>
      </Flex>
      {code && origin && (
        <PreviewBase
          nftImage={
            <FallbackImage boxShadow="lg" metadata={origin.nft.metadata} />
          }
        >
          <P5Sketch
            randomness={origin.randomness}
            dim={{ w: 1500, h: 500 }}
            colors={origin.histogram}
            code={code}
          />
        </PreviewBase>
      )}
    </Container>
  );
};
