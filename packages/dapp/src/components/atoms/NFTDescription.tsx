import { NFTItem } from '@splicenft/common';
import React from 'react';
import { Flex, Heading, Text, Skeleton } from '@chakra-ui/react';
export const NFTDescription = ({ nft }: { nft?: NFTItem }) => {
  return (
    <Flex direction="column" maxW="50%">
      {nft ? (
        <>
          <Heading size="xl" mb={7}>
            {nft.name}
          </Heading>
          <Text>{nft.metadata?.description}</Text>
        </>
      ) : (
        <Skeleton height="20px" />
      )}
    </Flex>
  );
};
