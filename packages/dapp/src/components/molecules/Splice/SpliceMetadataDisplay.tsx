import { Flex, Heading, Skeleton, Text } from '@chakra-ui/react';
import { SpliceNFT } from '@splicenft/common';
import React from 'react';
import { DominantColorsDisplay } from '../../molecules/DominantColors';

export const SpliceMetadata = ({
  tokenId,
  metadata,
  children
}: {
  tokenId?: number;
  metadata: SpliceNFT | undefined | null;
  children?: React.ReactNode;
}) => {
  return (
    <Flex p={3} direction="column" gridGap={3}>
      {metadata ? (
        <>
          <Heading size="md">Splice #{tokenId}</Heading>
          <Text>{metadata.description}</Text>

          <Text>
            <b>Randomness</b> {metadata.properties.randomness}
          </Text>
          <Text>
            <b>Style</b> {metadata.properties.style}
          </Text>
          <Text fontWeight="bold">Colors</Text>
          <DominantColorsDisplay colors={metadata.properties.colors} />
          {children}
        </>
      ) : (
        <Skeleton h="20px">no metadata yet</Skeleton>
      )}
    </Flex>
  );
};
