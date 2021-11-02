import { Center, Circle, Container, Flex, Image } from '@chakra-ui/react';
import { Style } from '@splicenft/common';
import { RGB } from 'get-rgba-palette';
import React, { useEffect, useState } from 'react';
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
  style,
  onSketched
}: {
  nftImageUrl: string;
  spliceDataUrl?: string | undefined;
  nftExtractedProps: {
    randomness: number;
    dominantColors: RGB[];
  };
  style?: Style;
  onSketched?: (dataUrl: string) => void;
}) => {
  const { dominantColors, randomness } = nftExtractedProps;
  const [code, setCode] = useState<string>();

  useEffect(() => {
    if (!style) return;
    (async () => {
      const _code = await style.getCode();
      setCode(_code);
    })();
  }, [style]);

  return (
    <Flex
      position="relative"
      minHeight="20vw"
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor="gray.200"
    >
      <Center width="100%" height="100%">
        {dominantColors && onSketched && !spliceDataUrl && style ? (
          <P5Sketch
            randomness={randomness}
            dim={{ w: 1500, h: 500 }}
            colors={dominantColors}
            onSketched={onSketched}
            code={code}
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
  onSketched,
  nftExtractedProps,
  spliceDataUrl,
  style
}: {
  nftImageUrl: string;
  onSketched?: (dataUrl: string) => void;
  nftExtractedProps: {
    randomness: number;
    dominantColors: RGB[];
  };
  spliceDataUrl?: string;
  style?: Style;
}) => {
  if (style && !spliceDataUrl) {
    return (
      <Preview
        nftImageUrl={nftImageUrl}
        onSketched={onSketched}
        nftExtractedProps={nftExtractedProps}
        style={style}
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
