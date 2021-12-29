import { Container, Image } from '@chakra-ui/react';
import { extractColors, Histogram, LoadImageBrowser } from '@splicenft/colors';
import { NFTItem, resolveImage, Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { FallbackImage } from '../atoms/FallbackImage';
import { P5Sketch } from '../molecules/P5Sketch';
import { PreviewBase } from '../molecules/PreviewBase';

const Preview = ({
  nftImage,
  nftExtractedProps,
  style,
  onSketched
}: {
  nftImage: React.ReactNode;
  nftExtractedProps: {
    randomness: number;
    dominantColors: Histogram;
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
        chainId === 1 ? 4 : chainId
      );
      setCode(_code);
    })();
  }, [style]);

  return (
    <PreviewBase nftImage={nftImage}>
      <P5Sketch
        randomness={randomness}
        dim={{ w: 1500, h: 500 }}
        colors={dominantColors.map((h) => h.rgb)}
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
  nftItem,
  onSketched,
  randomness,
  style,
  onDominantColors
}: {
  nftItem: NFTItem;
  onSketched: (dataUrl: string) => void;
  randomness: number;
  spliceDataUrl?: string;
  style: Style | undefined;
  onDominantColors?: (colors: Histogram) => void;
}) => {
  const [dominantColors, setDominantColors] = useState<Histogram>([]);

  const nftExtractedProps: {
    randomness: number;
    dominantColors: Histogram;
  } = {
    randomness,
    dominantColors
  };

  const onNFTImageLoaded = useCallback(
    (event: SyntheticEvent<HTMLImageElement, Event>): void => {
      if (spliceDataUrl || dominantColors?.length > 0) return;

      const onExtracted = (colors: Histogram) => {
        setDominantColors(colors);
        if (onDominantColors) onDominantColors(colors);
      };
      const target: HTMLImageElement = (event.target ||
        event.currentTarget) as HTMLImageElement;

      const proxyUrl = `${process.env.REACT_APP_CORS_PROXY}?url=${target.src}`;

      extractColors(proxyUrl, LoadImageBrowser, {
        dims: {
          w: target.width,
          h: target.height
        }
      })
        .then(onExtracted)
        .catch((e) => {
          console.error('fetching image data ultimatively failed: ', e.message);
        });
    },
    [dominantColors, spliceDataUrl]
  );

  const nftImage = (
    <FallbackImage
      boxShadow="lg"
      imgUrl={resolveImage(nftItem.metadata)}
      metadata={nftItem.metadata}
      onNFTImageLoaded={onNFTImageLoaded}
    />
  );

  if (style && !spliceDataUrl && dominantColors.length > 0) {
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
    return <Container py={[null, 5, 20]}>{nftImage}</Container>;
  }
};
