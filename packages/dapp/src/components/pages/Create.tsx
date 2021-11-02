import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';
import { NFTItem, resolveImage, Splice } from '@splicenft/common';
import { RGB } from 'get-rgba-palette';
import React, { useEffect, useState } from 'react';
import { P5Instance, ReactP5Wrapper } from 'react-p5-wrapper';
import { useSplice } from '../../context/SpliceContext';
import { FallbackImage } from '../atoms/FallbackImage';
import { DominantColors } from '../molecules/DominantColors';

const NFTChooser = ({ onNFT }: { onNFT: (nftItem: NFTItem) => unknown }) => {
  const [collection, setCollection] = useState<string>();
  const [tokenId, setTokenId] = useState<string>();

  const { indexer } = useSplice();

  const loadNft = async () => {
    if (!indexer || !collection || !tokenId) return;
    console.log(collection, tokenId);

    const nftMetadata = await indexer.getAssetMetadata(collection, tokenId);

    if (nftMetadata) {
      onNFT({
        contract_address: collection,
        token_id: tokenId,
        metadata: nftMetadata
      });
    }
  };

  return (
    <Flex
      as="form"
      direction="column"
      onSubmit={(e) => {
        e.preventDefault();
        loadNft();
      }}
      w="full"
    >
      <FormControl>
        <FormLabel>Collection address</FormLabel>
        <Input
          bg="white"
          variant="filled"
          type="text"
          placeholder="0x"
          onChange={(e) => setCollection(e.target.value)}
          value={collection}
        />
      </FormControl>
      <FormControl>
        <FormLabel>TokenId</FormLabel>
        <Input
          bg="white"
          type="text"
          onChange={(e) => setTokenId(e.target.value)}
          value={tokenId}
        />
      </FormControl>
      <Button type="submit" my={6} variant="black">
        Submit
      </Button>
    </Flex>
  );
};
const PreviewSketch = (props: {
  dim: { w: number; h: number };
  randomness: number;
  colors: RGB[];
  code: string;
}) => {
  const { dim, colors, randomness, code } = props;
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
            status: 'error',
            title: 'Your code contains an error: ' + e.toString()
          });
        }
      }
    };

    p5.draw = () => {
      try {
        if (renderer) renderer({ p5, colors, dim });
        p5.noLoop();
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

export const CreatePage = () => {
  const [code, setCode] = useState<string>();
  const [dominantColors, setDominantColors] = useState<RGB[]>([]);

  const [nftItem, setNFTItem] = useState<NFTItem>();
  const [randomness, setRandomness] = useState<number>(0);

  useEffect(() => {
    if (!nftItem) return;
    setRandomness(
      Splice.computeRandomness(nftItem.contract_address, nftItem.token_id)
    );
  }, [nftItem]);
  const save = () => {
    const $el: HTMLTextAreaElement = document.getElementById(
      'codearea'
    ) as HTMLTextAreaElement;
    setCode($el.value);
  };

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      <Heading>Create your own Splice artwork style</Heading>
      <Heading size="sm" color="gray.400">
        Heads up: this is only here for validation, not very intuitive.
      </Heading>
      <Flex my={6} gridGap={6}>
        <Flex flex="2" w="full">
          <NFTChooser onNFT={setNFTItem} />
        </Flex>
        {nftItem && (
          <Flex flex="1">
            <FallbackImage metadata={nftItem.metadata} />
          </Flex>
        )}
      </Flex>
      {nftItem && (
        <Flex my={4} align="center" gridGap={3}>
          <Flex flex="1">
            <DominantColors
              imageUrl={resolveImage(nftItem.metadata)}
              dominantColors={dominantColors}
              setDominantColors={setDominantColors}
            />
          </Flex>
          <Flex flex="1">
            <Text>
              <strong>Random seed: </strong>
              {randomness}
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
      >{`function ({ p5, colors, dim }) {
  p5.fill(p5.color(colors[0][0], colors[0][1], colors[0][2]));
  p5.stroke(p5.color(colors[1][0], colors[1][1], colors[1][2]));
  p5.strokeWeight(15);
  p5.rect(100,50,dim.w-100,dim.h-100);
}`}</Textarea>
      <Flex my={4}>
        <Button onClick={save} variant="black">
          Save
        </Button>
      </Flex>
      {code && nftItem && (
        <PreviewSketch
          code={code}
          randomness={randomness}
          dim={{ w: 1500, h: 500 }}
          colors={dominantColors}
        />
      )}
    </Container>
  );
};
