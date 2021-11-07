import { Center, Circle, Container, Flex, Image } from '@chakra-ui/react';
import { extractColors, Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { RGB } from 'get-rgba-palette';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import { FallbackImage } from '../atoms/FallbackImage';
import { P5Sketch } from '../molecules/P5Sketch';

const Preview = ({
  nftImage,
  spliceDataUrl,
  nftExtractedProps,
  style,
  onSketched
}: {
  nftImage: React.ReactNode;
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
  const { chainId } = useWeb3React();

  useEffect(() => {
    if (!style || !chainId) return;
    (async () => {
      const _code = await style.getCodeFromBackend(
        process.env.REACT_APP_VALIDATOR_BASEURL as string,
        chainId
      );
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
      <Center width="100%" height="100%" position="relative">
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
        <Circle size="15%">{nftImage}</Circle>
      </Center>
    </Flex>
  );
};

export const CreativePanel = ({
  nftImageUrl,
  onSketched,
  randomness,
  spliceDataUrl,
  style,
  onDominantColors
}: {
  nftImageUrl: string;
  onSketched?: (dataUrl: string) => void;
  randomness: number;
  spliceDataUrl?: string;
  style?: Style;
  onDominantColors?: (colors: RGB[]) => void;
}) => {
  const [dominantColors, setDominantColors] = useState<RGB[]>([]);

  const nftExtractedProps: {
    randomness: number;
    dominantColors: RGB[];
  } = {
    randomness,
    dominantColors
  };

  const onNFTImageLoaded = (
    event: SyntheticEvent<HTMLImageElement, Event>
  ): void => {
    extractColors(event.currentTarget, {}).then((colors) => {
      setDominantColors(colors);
      if (onDominantColors) onDominantColors(colors);
    });
  };

  const nftImage = (
    <FallbackImage
      border="4px solid white"
      rounded="full"
      boxShadow="lg"
      imgUrl={nftImageUrl}
      onNFTImageLoaded={onNFTImageLoaded}
    />
  );

  if (style && !spliceDataUrl) {
    return (
      <Preview
        nftImage={nftImage}
        onSketched={onSketched}
        nftExtractedProps={nftExtractedProps}
        style={style}
      />
    );
  } else if (spliceDataUrl) {
    return (
      <Preview
        nftImage={nftImage}
        spliceDataUrl={spliceDataUrl}
        nftExtractedProps={nftExtractedProps}
      />
    );
  } else {
    return (
      <Container width="lg" py={20}>
        <FallbackImage
          boxShadow="lg"
          imgUrl={nftImageUrl}
          onNFTImageLoaded={onNFTImageLoaded}
        />
      </Container>
    );
  }
};
