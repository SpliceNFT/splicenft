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
import { Histogram, RGB, rgbToHex } from '@splicenft/colors';
import { dataUriToBlob } from '@splicenft/common';
import React, { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { CreativeOrigin } from '../../types/CreativeOrigin';
import { FallbackImage } from '../atoms/FallbackImage';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { P5Sketch } from '../molecules/P5Sketch';
import { PreviewBase } from '../molecules/PreviewBase';
import { NFTChooser } from '../organisms/NFTChooser';
import { minify } from 'terser';

const GRAYSCALE_COLORS: RGB[] = [
  [20, 20, 20],
  [125, 125, 125],
  [250, 250, 250],
  [220, 220, 220],
  [200, 200, 200],
  [170, 170, 170],
  [80, 80, 80],
  [150, 150, 150],
  [40, 40, 40],
  [100, 100, 100]
];

const GRAYSCALE_HISTOGRAM: Histogram = GRAYSCALE_COLORS.map((rgb: RGB) => ({
  rgb,
  hex: `#${rgbToHex(rgb)}`,
  freq: 0.1
}));

const CreatePage = () => {
  const [code, setCode] = useState<string>();

  const [origin, setOrigin] = useState<CreativeOrigin>();
  const [histogram, setHistogram] = useState<Histogram>();
  const [randomness, setRandomness] = useState<number>(0);
  const [preview, setPreview] = useState<string>();

  const codeRef = useRef<HTMLTextAreaElement>(null);

  const updateCode = () => {
    const $el: HTMLTextAreaElement = document.getElementById(
      'codearea'
    ) as HTMLTextAreaElement;
    setCode($el.value);
  };

  useEffect(() => {
    setHistogram(origin ? origin.histogram : GRAYSCALE_HISTOGRAM);
    setRandomness(origin?.randomness || 0);
  }, [origin]);

  const download = () => {
    if (!preview) return;
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(dataUriToBlob(preview));
    link.download = `splice_preview.png`;
    link.click();
  };

  const terse = async (_code: string) => {
    const tersed = await minify(_code, {
      compress: {
        dead_code: true,
        evaluate: false,
        unused: false
      }
    });
    console.log(tersed.code);
    if (codeRef.current) {
      codeRef.current.value = tersed.code || _code;
    }
    setCode(tersed.code);
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
      {histogram && (
        <Flex my={4} align="center" gridGap={3}>
          <DominantColorsDisplay colors={histogram} showDetails />
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
        ref={codeRef}
        defaultValue={`function splice({ p5, params, dim }) {
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
      <Flex my={4} justify="space-between">
        <Button
          disabled={!!origin}
          onClick={() => setRandomness(Math.floor(1_000_000 * Math.random()))}
        >
          Randomize {randomness}
        </Button>

        <Button disabled={!preview} onClick={download}>
          Download
        </Button>
        <Button onClick={() => terse(code as string)} disabled={!code}>
          terse
        </Button>
        <Button
          onClick={updateCode}
          variant="black"
          disabled={!histogram}
          leftIcon={<FaPlay />}
        >
          Run code
        </Button>
      </Flex>
      {code && histogram && (
        <PreviewBase
          nftImage={
            <FallbackImage boxShadow="lg" metadata={origin?.nft.metadata} />
          }
        >
          <P5Sketch
            randomness={randomness}
            dim={{ w: 1500, h: 500 }}
            colors={histogram}
            code={code}
            onSketched={setPreview}
          />
        </PreviewBase>
      )}
    </Container>
  );
};

export default CreatePage;
