import { Image, SystemProps } from '@chakra-ui/react';
import { NFTMetaData, resolveImage } from '@splicenft/common';
import React, { SyntheticEvent } from 'react';
import SplicePFPLogo from '../../img/SpliceLogoPFP.png';

export const FallbackImage = (
  props: {
    imgUrl?: string | undefined;
    metadata?: NFTMetaData | null;

    onNFTImageLoaded?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  } & SystemProps
) => {
  const { imgUrl, metadata, onNFTImageLoaded, ...rest } = props;

  let imageUrl;

  if (imgUrl) {
    imageUrl = imgUrl;
  } else if (metadata) {
    imageUrl = resolveImage(metadata);
  }

  return (
    <Image
      src={imageUrl}
      title={imageUrl}
      fit="cover"
      crossOrigin="anonymous"
      onLoad={onNFTImageLoaded}
      fallback={<Image src={SplicePFPLogo} />}
      {...rest}
      /*opacity={buzy ? 0.2 : 1}*/
    />
  );
};
