import React from 'react';
import { NFTItem } from '../../types/NFTPort';
import { Flex, Text } from '@chakra-ui/react';

const MetaDataItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <Flex direction="row" justify="space-between" gridGap={5}>
      <Text fontWeight="bold">{label}</Text>
      <Text fontWeight="normal" isTruncated>
        {value}
      </Text>
    </Flex>
  );
};

export const MetaDataDisplay = ({
  nft,
  collection,
  tokenId
}: {
  nft: NFTItem;
  collection: string;
  tokenId: string;
}) => {
  const { metadata } = nft;
  console.log(metadata?.attributes);
  return (
    <Flex direction="column" gridGap={3}>
      <MetaDataItem label="collection" value={collection} />
      <MetaDataItem label="token id" value={tokenId} />
      {metadata?.attributes?.map((attr) => {
        return (
          <MetaDataItem
            key={`attr-${attr.trait_type}`}
            label={attr.trait_type}
            value={attr.value}
          />
        );
      })}
    </Flex>
  );
};
