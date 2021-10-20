import { Image, SystemProps } from '@chakra-ui/react';
import { NFTMetaData, resolveImage } from '@splicenft/common';
import React from 'react';
import SplicePFPLogo from '../../img/SpliceLogoPFP.png';

export const FallbackImage = (
  props: {
    imgUrl?: string | undefined;
    metadata?: NFTMetaData | null;
  } & SystemProps
) => {
  const { imgUrl, metadata, ...rest } = props;

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
      boxSize="fit-content"
      w="100%"
      objectFit="cover"
      alt={imageUrl}
      fallbackSrc={SplicePFPLogo}
      {...rest}
      /*opacity={buzy ? 0.2 : 1}*/
    />
  );
};
