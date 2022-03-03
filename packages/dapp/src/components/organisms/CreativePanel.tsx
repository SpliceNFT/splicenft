import { Container, Image } from '@chakra-ui/react';
import { Histogram } from '@splicenft/colors';
import { BANNER_DIMS, NFTTrait, Style } from '@splicenft/common';
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
    colors: Histogram;
    randomness: number;
  };
  style: Style;
  onSketched: (dataUrl: string, traits: NFTTrait[]) => void;
}) => {
  const [code, setCode] = useState<string>();
  const { chainId } = useWeb3React();

  useEffect(() => {
    if (!style || !chainId) return;
    let unmounted = false;
    (async () => {
      const _code = await style.getCodeFromBackend(
        process.env.REACT_APP_VALIDATOR_BASEURL as string,
        chainId
      );
      if (!unmounted) setCode(_code);
    })();
    return () => {
      unmounted = true;
    };
  }, [style]);

  return (
    <PreviewBase nftImage={nftImage}>
      {code && (
        <P5Sketch
          drawArgs={{
            dim: BANNER_DIMS,
            params: nftExtractedProps
          }}
          onSketched={onSketched}
          code={code}
        />
      )}
    </PreviewBase>
  );
};

export const DataSketch = ({
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

export const CreativePanel = (props: {
  spliceDataUrl?: string;
  nftFeatures?: {
    randomness: number;
    colors: Histogram;
  };
  style?: Style;
  onSketched: (dataUrl: string, traits: NFTTrait[]) => void;
  children: React.ReactNode;
}) => {
  const { spliceDataUrl, nftFeatures, style, onSketched, children } = props;
  if (!spliceDataUrl && style && nftFeatures) {
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
