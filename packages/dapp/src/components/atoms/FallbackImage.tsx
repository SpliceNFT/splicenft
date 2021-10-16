import { Image, SystemProps } from '@chakra-ui/react';
import React from 'react';
import SplicePFPLogo from '../../img/SpliceLogoPFP.png';

export const FallbackImage = (props: { imgUrl: string } & SystemProps) => {
  const { imgUrl, ...rest } = props;

  return (
    <Image
      src={imgUrl}
      title={imgUrl}
      boxSize="fit-content"
      objectFit="cover"
      alt={imgUrl}
      fallbackSrc={SplicePFPLogo}
      {...rest}
      /*opacity={buzy ? 0.2 : 1}*/
    />
  );
};
