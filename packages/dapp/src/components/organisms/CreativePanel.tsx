import { Container, Image } from '@chakra-ui/react';
import { Histogram, NFTItem, resolveImage, Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
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
        colors={dominantColors.map((c) => c.rgb)}
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
  dominantColors
}: {
  nftItem: NFTItem;
  onSketched: (dataUrl: string) => void;
  randomness: number;
  spliceDataUrl?: string;
  style: Style | undefined;
  dominantColors: Histogram;
}) => {
  const nftImage = (
    <FallbackImage
      boxShadow="lg"
      imgUrl={resolveImage(nftItem.metadata)}
      metadata={nftItem.metadata}
    />
  );

  if (style && !spliceDataUrl && dominantColors.length > 0) {
    return (
      <Preview
        nftImage={nftImage}
        onSketched={onSketched}
        nftExtractedProps={{
          randomness,
          dominantColors
        }}
        style={style}
      />
    );
  } else if (spliceDataUrl) {
    return <DataSketch nftImage={nftImage} spliceDataUrl={spliceDataUrl} />;
  } else {
    return <Container py={[null, 5, 20]}>{nftImage}</Container>;
  }
};
