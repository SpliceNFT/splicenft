import { Box, Circle, Image } from '@chakra-ui/react';
import React from 'react';
import { FallbackImage } from '../../atoms/FallbackImage';

export const SpliceArtwork = ({
  spliceImageUrl,
  originImageUrl
}: {
  spliceImageUrl: string | null | undefined;
  originImageUrl: string | null | undefined;
}) => {
  return (
    <Box position="relative" bg="transparent">
      {spliceImageUrl ? <Image src={spliceImageUrl} /> : <Box bg="grey.200" />}
      <Box width="100%" height="100%">
        <Circle size="120px" bottom="10px" position="absolute" left="10px">
          {originImageUrl && (
            <FallbackImage
              imgUrl={originImageUrl}
              rounded="full"
              border="4px solid white"
            />
          )}
        </Circle>
      </Box>
    </Box>
  );
};
