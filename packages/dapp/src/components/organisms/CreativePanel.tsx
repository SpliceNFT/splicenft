import {
  Box,
  Button,
  Center,
  Circle,
  Container,
  Text,
  Flex,
  Image,
  Link
} from '@chakra-ui/react';
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
  nftImageUrl,
  spliceDataUrl,
  nftExtractedProps,
  rendererName,
  setP5Canvas
}: {
  dominantColors?: RGB[];
  nftImageUrl: string;
  spliceDataUrl?: string | undefined;
  nftExtractedProps: {
    randomness: number;
    dominantColors: RGB[];
  };
  rendererName?: string;
  setP5Canvas?: (canvas: p5Types) => void;
}) => {
  const { dominantColors, randomness } = nftExtractedProps;

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
    </Flex>
  );
};

export const CreativePanel = ({
  nftImageUrl,
  setP5Canvas,
  nftExtractedProps,
  spliceDataUrl,
  rendererName
}: {
  nftImageUrl: string;
  setP5Canvas: (canvas: p5Types) => void;
  nftExtractedProps: {
    randomness: number;
    dominantColors: RGB[];
  };
  spliceDataUrl?: string;
  rendererName?: string;
}) => {
  if (rendererName && !spliceDataUrl) {
    return (
      <Preview
        nftImageUrl={nftImageUrl}
        setP5Canvas={setP5Canvas}
        nftExtractedProps={nftExtractedProps}
        rendererName={rendererName}
      />
    );
  } else if (spliceDataUrl) {
    return (
      <Preview
        nftImageUrl={nftImageUrl}
        spliceDataUrl={spliceDataUrl}
        nftExtractedProps={nftExtractedProps}
      />
    );
  } else {
    return <PlainImage imgUrl={nftImageUrl} />;
  }
};

/*
 {mintingState === MintingState.MINTED && (
        <Box position="absolute" right="10px" bottom="10px">
          <Button as={Link} href={spliceDataUrl} isExternal variant="black">
            download
          </Button>
        </Box>
      )}
      */
