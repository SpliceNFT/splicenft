import {
  Box,
  Button,
  Center,
  Circle,
  Container,
  Flex,
  Image,
  Link
} from '@chakra-ui/react';
import { MintingState } from '@splicenft/common';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React from 'react';
import { P5Sketch } from '../molecules/P5Sketch';

export const PlainImage = ({ imgUrl }: { imgUrl: string }) => {
  return (
    <Container width="lg" py={20}>
      <Flex rounded="lg" minH="80">
        <Image
          src={imgUrl}
          title={imgUrl}
          boxSize="fit-content"
          objectFit="cover"
          alt={imgUrl}
          boxShadow="lg"
          fallbackSrc="https://via.placeholder.com/800"
          /*opacity={buzy ? 0.2 : 1}*/
        />
      </Flex>
    </Container>
  );
};

const Preview = ({
  dominantColors,
  nftImageUrl,
  spliceDataUrl,
  randomness,
  rendererName,
  setP5Canvas,
  mintingState
}: {
  dominantColors?: RGB[];
  nftImageUrl: string;
  spliceDataUrl?: string | undefined;
  randomness: number;
  rendererName?: string;
  setP5Canvas?: (canvas: p5Types) => void;
  mintingState: MintingState;
}) => {
  return (
    <Flex position="relative">
      <Center width="100%" height="100%">
        {dominantColors && setP5Canvas && !spliceDataUrl && rendererName ? (
          <P5Sketch
            randomness={randomness}
            dim={{ w: 1500, h: 500 }}
            colors={dominantColors}
            onCanvasCreated={setP5Canvas}
            rendererName={rendererName}
          />
        ) : (
          <Image src={spliceDataUrl} />
        )}
      </Center>
      <Center position="absolute" width="100%" height="100%">
        <Circle size="200px">
          <Image
            border="4px solid white"
            rounded="full"
            src={nftImageUrl}
            title={nftImageUrl}
            alt={nftImageUrl}
            fallbackSrc="https://via.placeholder.com/800"
            /*opacity={buzy ? 0.2 : 1}*/
          />
        </Circle>
      </Center>
      {mintingState === MintingState.MINTED && (
        <Box position="absolute" right="10px" bottom="10px">
          <Button as={Link} href={spliceDataUrl} isExternal variant="black">
            download
          </Button>
        </Box>
      )}
    </Flex>
  );
};

export const CreativePanel = ({
  nftImageUrl,
  dominantColors,
  setP5Canvas,
  randomness,
  spliceDataUrl,
  rendererName,
  mintingState
}: {
  nftImageUrl: string;
  dominantColors: RGB[];
  setP5Canvas: (canvas: p5Types) => void;
  randomness: number;
  spliceDataUrl?: string;
  rendererName?: string;
  mintingState: MintingState;
}) => {
  if (
    mintingState >= MintingState.GENERATING &&
    mintingState < MintingState.SAVED &&
    rendererName
  ) {
    return (
      <Preview
        nftImageUrl={nftImageUrl}
        dominantColors={dominantColors}
        setP5Canvas={setP5Canvas}
        randomness={randomness}
        rendererName={rendererName}
        mintingState={mintingState}
      />
    );
  } else if (mintingState >= MintingState.SAVED && spliceDataUrl) {
    return (
      <Preview
        nftImageUrl={nftImageUrl}
        spliceDataUrl={spliceDataUrl}
        randomness={randomness}
        mintingState={mintingState}
      />
    );
  } else {
    return <PlainImage imgUrl={nftImageUrl} />;
  }
};
