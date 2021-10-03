import React from 'react';
import { NFTItem } from '../../types/NFTPort';
import { Flex, Text } from '@chakra-ui/react';

export const MetaDataDisplay = ({ nft }: { nft: NFTItem }) => {
  const { metadata } = nft;
  console.log(metadata?.attributes);
  return (
    <Flex direction="column" gridGap={3}>
      {metadata?.attributes?.map((attr) => {
        return (
          <Flex direction="row" justify="space-between">
            <Text fontWeight="bold">{attr.trait_type}</Text>
            <Text fontWeight="normal">{attr.value}</Text>
          </Flex>
        );
      })}
    </Flex>
  );
};
