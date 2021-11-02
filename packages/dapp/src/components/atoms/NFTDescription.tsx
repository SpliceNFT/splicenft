import { Flex, Heading, Text, SkeletonText, Link } from '@chakra-ui/react';
import { NFTMetaData, StyleNFT } from '@splicenft/common';
import React from 'react';

export const NFTDescription = ({
  nftMetadata,
  styleNFT
}: {
  nftMetadata?: NFTMetaData;
  styleNFT?: StyleNFT;
}) => {
  const props = styleNFT?.properties;
  return (
    <Flex direction="column" maxW="50%">
      {styleNFT && (
        <Flex direction="column" mb={12}>
          <Heading size="xl" mb={2}>
            {styleNFT.name}
          </Heading>
          <Text>{styleNFT.description}</Text>
          <Flex my={4} p={2} bg="gray.100">
            {props && (
              <Flex gridGap={3}>
                <Text>Artist: </Text>
                <Link fontWeight="bold" href={props.creator_twitter} isExternal>
                  {props.creator_name}
                </Link>
              </Flex>
            )}
          </Flex>
        </Flex>
      )}

      {nftMetadata ? (
        <>
          <Heading size="lg" mb={2}>
            {nftMetadata.name}
          </Heading>
          <Text>{nftMetadata.description}</Text>
        </>
      ) : (
        <SkeletonText noOfLines={3} />
      )}
    </Flex>
  );
};
