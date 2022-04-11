import { Container, Image } from '@chakra-ui/react';
import { BANNER_DIMS, NFTTrait, Style, Transfer } from '@splicenft/common';
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
  nftExtractedProps: Transfer.OriginFeatures;
  style: Style;
  onSketched: (dataUrl: string, traits: NFTTrait[]) => void;
}) => {
  const [code, setCode] = useState<string>();

  useEffect(() => {
    if (!style) return;
    let unmounted = false;
    (async () => {
      const _code = await style.getCodeFromBackend(
        process.env.REACT_APP_VALIDATOR_BASEURL as string
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
  nftFeatures?: Transfer.OriginFeatures;
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
