import { Flex, Heading, Text } from '@chakra-ui/react';
import { NFTMetaData } from '@splicenft/common';
import React from 'react';

export const NFTDescription = ({
  nftMetadata
}: {
  nftMetadata: NFTMetaData;
}) => {
  return (
    <Flex direction="column" maxW="50%">
      <>
        <Heading size="xl" mb={7}>
          {nftMetadata.name}
        </Heading>
        <Text>{nftMetadata.description}</Text>
      </>
    </Flex>
  );
};
