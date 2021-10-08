import {
  Box,
  Center,
  Circle,
  Container,
  Flex,
  Image,
  Link,
  Button
} from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React from 'react';
import { P5Sketch } from '../molecules/P5Sketch';
import { MintingState } from '@splicenft/common';

const PlainImage = ({ imgUrl }: { imgUrl: string }) => {
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
  imgUrl,
  dataUrl,
  randomness,
  rendererName,
  setP5Canvas,
  mintingState
}: {
  dominantColors?: RGB[];
  imgUrl: string;
  dataUrl?: string | undefined;
  randomness: number;
  rendererName?: string;
  setP5Canvas?: (canvas: p5Types) => void;
  mintingState: MintingState;
}) => {
  return (
    <Flex position="relative">
      <Center width="100%" height="100%">
        {dominantColors && setP5Canvas && !dataUrl && rendererName ? (
          <P5Sketch
            randomness={randomness}
            dim={{ w: 1500, h: 500 }}
            colors={dominantColors}
            onCanvasCreated={setP5Canvas}
            rendererName={rendererName}
          />
        ) : (
          <Image src={dataUrl} />
        )}
      </Center>
      <Center position="absolute" width="100%" height="100%">
        <Circle size="200px">
          <Image
            border="4px solid white"
            rounded="full"
            src={imgUrl}
            title={imgUrl}
            alt={imgUrl}
            fallbackSrc="https://via.placeholder.com/800"
            /*opacity={buzy ? 0.2 : 1}*/
          />
        </Circle>
      </Center>
      {mintingState === MintingState.MINTED && (
        <Box position="absolute" right="10px" bottom="10px">
          <Button as={Link} href={dataUrl} isExternal variant="black">
            download
          </Button>
        </Box>
      )}
    </Flex>
  );
};

export const CreativePanel = ({
  imgUrl,
  dominantColors,
  setP5Canvas,
  randomness,
  dataUrl,
  rendererName,
  mintingState
}: {
  imgUrl: string;
  dominantColors: RGB[];
  setP5Canvas: (canvas: p5Types) => void;
  randomness: number;
  dataUrl: string | undefined;
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
        imgUrl={imgUrl}
        dominantColors={dominantColors}
        setP5Canvas={setP5Canvas}
        randomness={randomness}
        rendererName={rendererName}
        mintingState={mintingState}
      />
    );
  } else if (mintingState >= MintingState.SAVED && dataUrl) {
    return (
      <Preview
        imgUrl={imgUrl}
        dataUrl={dataUrl}
        randomness={randomness}
        mintingState={mintingState}
      />
    );
  } else {
    return <PlainImage imgUrl={imgUrl} />;
  }
};
