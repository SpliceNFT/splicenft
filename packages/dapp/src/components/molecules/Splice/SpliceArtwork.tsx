import { Circle, Flex } from '@chakra-ui/react';
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
    <Flex position="relative" bg="transparent">
      {spliceImageUrl ? (
        <FallbackImage imgUrl={spliceImageUrl} />
      ) : (
        <Flex bg="grey.200" />
      )}

      <Circle size="15%" bottom="10%" left="10px" position="absolute">
        {originImageUrl && (
          <FallbackImage
            imgUrl={originImageUrl}
            rounded="full"
            border="4px solid white"
          />
        )}
      </Circle>
    </Flex>
  );
};
