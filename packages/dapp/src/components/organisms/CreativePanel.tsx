import { Center, Circle, Container, Flex, Image } from '@chakra-ui/react';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';
import React from 'react';
import { MintingState } from '../../modules/splice';
import { P5Sketch } from '../molecules/P5Sketch';

const PlainImage = ({ imgUrl }: { imgUrl: string }) => {
  return (
    <Container width="lg">
      <Flex rounded="lg" minH="80">
        <Image
          py={20}
          src={imgUrl}
          title={imgUrl}
          boxSize="fit-content"
          objectFit="cover"
          alt={imgUrl}
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
  setP5Canvas
}: {
  dominantColors?: RGB[];
  imgUrl: string;
  dataUrl?: string | undefined;
  setP5Canvas?: (canvas: p5Types) => void;
}) => {
  return (
    <Flex position="relative">
      <Center width="100%" height="100%">
        {dominantColors && setP5Canvas && !dataUrl ? (
          <P5Sketch
            dim={{ w: 1500, h: 500 }}
            colors={dominantColors}
            onCanvasCreated={setP5Canvas}
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
    </Flex>
  );
};

export const CreativePanel = ({
  imgUrl,
  dominantColors,
  setP5Canvas,
  dataUrl,
  mintingState
}: {
  imgUrl: string;
  dominantColors: RGB[];
  dataUrl: string | undefined;
  setP5Canvas: (canvas: p5Types) => void;
  mintingState: MintingState;
}) => {
  if (
    mintingState >= MintingState.GENERATING &&
    mintingState < MintingState.SAVED
  ) {
    return (
      <Preview
        imgUrl={imgUrl}
        dominantColors={dominantColors}
        setP5Canvas={setP5Canvas}
      />
    );
  } else if (mintingState >= MintingState.SAVED && dataUrl) {
    return <Preview imgUrl={imgUrl} dataUrl={dataUrl} />;
  } else {
    return <PlainImage imgUrl={imgUrl} />;
  }
};
