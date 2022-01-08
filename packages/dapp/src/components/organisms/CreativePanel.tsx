import { Container, Image } from '@chakra-ui/react';
import { Histogram } from '@splicenft/colors';
import { NFTItem, Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { P5Sketch } from '../molecules/P5Sketch';
import { PreviewBase } from '../molecules/PreviewBase';

export const Preview = ({
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
    let unmounted = false;
    (async () => {
      const _code = await style.getCodeFromBackend(
        process.env.REACT_APP_VALIDATOR_BASEURL as string,
        chainId === 1 ? 4 : chainId
      );
      if (!unmounted) setCode(_code);
    })();
    return () => {
      unmounted = true;
    };
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
  nftFeatures,
  style,
  onSketched,
  children
}: {
  spliceDataUrl?: string;
  nftFeatures?: {
    randomness: number;
    dominantColors: Histogram;
  };

  style: Style | undefined;
  onSketched: (dataUrl: string) => void;
  children: React.ReactNode;
}) => {
  if (style && !spliceDataUrl && nftFeatures) {
    return (
      <Preview
        nftImage={children}
        onSketched={onSketched}
        nftExtractedProps={nftFeatures}
        style={style}
      />
    );
  } else if (spliceDataUrl) {
    return <DataSketch nftImage={children} spliceDataUrl={spliceDataUrl} />;
  } else {
    return <Container py={[null, 5, 20]}>{children}</Container>;
  }
};
