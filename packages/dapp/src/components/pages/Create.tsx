import {
  Button,
  Container,
  Flex,
  Heading,
  Link,
  Spacer,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';
import { GRAYSCALE_HISTOGRAM, Histogram } from '@splicenft/colors';
import { BANNER_DIMS, dataUriToBlob, NFTTrait } from '@splicenft/common';
import React, { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { minify } from 'terser';
import { CreativeOrigin } from '../../types/CreativeOrigin';
import { FallbackImage } from '../atoms/FallbackImage';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { P5Sketch } from '../molecules/P5Sketch';
import { PreviewBase } from '../molecules/PreviewBase';
import { MetaDataItem } from '../organisms/MetaDataDisplay';
import { NFTChooser } from '../organisms/NFTChooser';

const CreatePage = () => {
  const [code, setCode] = useState<string>();

  const [origin, setOrigin] = useState<CreativeOrigin>();
  const [histogram, setHistogram] = useState<Histogram>();
  const [randomness, setRandomness] = useState<number>(0);
  const [preview, setPreview] = useState<string>();
  const [traits, setTraits] = useState<NFTTrait[]>([]);

  const codeRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

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
    try {
      const tersed = await minify(_code, {
        compress: {
          dead_code: true,
          evaluate: false,
          unused: false
        }
      });
      if (codeRef.current) {
        codeRef.current.value = tersed.code || _code;
      }
      setCode(tersed.code);
    } catch (e: any) {
      toast({
        status: 'warning',
        title: 'error when tersing',
        description: e.message
      });
    }
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
  const trait1 = {trait_type: "Favorite_Pet", value: p5.random() > 0.5 ? 'Cat' : 'Dog'};
  const trait2 = {trait_type: "Favorite_Food", value: p5.random() > 0.8 ? 'Broccoli' : 'Marshmallow'};
  return [
    trait1, trait2
  ];
}`}
      ></Textarea>
      <Flex my={4} justify="space-between">
        <Button
          disabled={!!origin}
          onClick={(e) => {
            e.preventDefault();
            setRandomness(Math.floor(1_000_000 * Math.random()));
          }}
          title={`${randomness}`}
        >
          <Flex direction="column">
            <Text>randomize</Text>
            <Text>{randomness}</Text>
          </Flex>
        </Button>

        <Button disabled={!preview} onClick={download}>
          download
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            terse(code as string);
          }}
          disabled={!code}
        >
          terse code
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
            drawArgs={{
              dim: BANNER_DIMS,
              params: {
                randomness,
                colors: histogram
              }
            }}
            code={code}
            onSketched={(dataUrl, _traits) => {
              setPreview(dataUrl);
              setTraits(_traits);
            }}
          />
        </PreviewBase>
      )}
      {traits.map((t) => (
        <MetaDataItem
          key={`t-${t.trait_type}`}
          label={t.trait_type}
          value={t.value}
        />
      ))}
    </Container>
  );
};

export default CreatePage;
