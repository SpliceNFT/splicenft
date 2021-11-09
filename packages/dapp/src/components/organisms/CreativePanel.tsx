import { Center, Circle, Container, Flex, Image } from '@chakra-ui/react';
import { extractColors, Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { RGB } from 'get-rgba-palette';
import React, { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { FallbackImage } from '../atoms/FallbackImage';
import { P5Sketch } from '../molecules/P5Sketch';

const PreviewBase = ({
  nftImage,
  children
}: {
  nftImage: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Flex
    position="relative"
    minHeight="20vw"
    borderBottomWidth="1px"
    borderBottomStyle="solid"
    borderBottomColor="gray.200"
  >
    <Center width="100%" height="100%" position="relative">
      {children}
    </Center>
    <Center position="absolute" width="100%" height="100%">
      <Circle size="15%">{nftImage}</Circle>
    </Center>
  </Flex>
);
const Preview = ({
  nftImage,
  nftExtractedProps,
  style,
  onSketched
}: {
  nftImage: React.ReactNode;
  nftExtractedProps: {
    randomness: number;
    dominantColors: RGB[];
  };
  style: Style;
  onSketched: (dataUrl: string) => void;
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
    <PreviewBase nftImage={nftImage}>
      <P5Sketch
        randomness={randomness}
        dim={{ w: 1500, h: 500 }}
        colors={dominantColors}
        onSketched={onSketched}
        code={code}
      />
    </PreviewBase>
  );
};

const DataSketch = ({
  nftImage,
  spliceDataUrl
}: {
  nftImage: React.ReactNode;
  spliceDataUrl: string;
}) => {
  return (
    <PreviewBase nftImage={nftImage}>
      <Image src={spliceDataUrl} />
    </PreviewBase>
  );
};

export const CreativePanel = ({
  spliceDataUrl,
  nftImageUrl,
  onSketched,
  randomness,
  style,
  onDominantColors
}: {
  nftImageUrl: string;
  onSketched: (dataUrl: string) => void;
  randomness: number;
  spliceDataUrl?: string;
  style: Style | undefined;
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

  const onNFTImageLoaded = useCallback(
    (event: SyntheticEvent<HTMLImageElement, Event>): void => {
      if (spliceDataUrl || dominantColors?.length > 0) return;

      const xOptions = {
        proxy: process.env.REACT_APP_CORS_PROXY
      };
      const onExtracted = (colors: RGB[]) => {
        setDominantColors(colors);
        if (onDominantColors) onDominantColors(colors);
      };
      const target: HTMLImageElement = (event.target ||
        event.currentTarget) as HTMLImageElement;

      extractColors(target, xOptions)
        .then(onExtracted)
        .catch((e: any) => {
          console.log(
            'extracting failed, trying again with cors proxy. Reason:',
            e.message
          );
          //console.log(event);
          //try again with plain source
          extractColors(target.src, xOptions)
            .then(onExtracted)
            .catch((e) => {
              console.error(
                'fetching image data ultimatively failed: ',
                e.message
              );
            });
        });
    },
    [dominantColors, spliceDataUrl]
  );

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
    return <DataSketch nftImage={nftImage} spliceDataUrl={spliceDataUrl} />;
  } else {
    return (
      <Container py={[null, 5, 20]}>
        <FallbackImage
          boxShadow="lg"
          imgUrl={nftImageUrl}
          onNFTImageLoaded={onNFTImageLoaded}
        />
      </Container>
    );
  }
};
