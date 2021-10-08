import React from 'react';
import { NFTItem } from '@splicenft/common';
import { Flex, Text, Link } from '@chakra-ui/react';
import { SpliceToken } from '../../types/SpliceToken';

const MetaDataItem = ({
  label,
  value,
  link
}: {
  label: string;
  value: string | number;
  link?: string | undefined;
}) => {
  return (
    <Flex direction="row" justify="space-between" gridGap={5}>
      <Text fontWeight="bold">{label}</Text>
      <Text fontWeight="normal" isTruncated>
        {link ? (
          <Link href={link} isExternal>
            {value}
          </Link>
        ) : (
          value
        )}
      </Text>
    </Flex>
  );
};

export const MetaDataDisplay = ({
  nft,
  collection,
  tokenId,
  randomness,
  spliceMetadata
}: {
  nft: NFTItem;
  collection: string;
  tokenId: string;
  randomness: number;
  spliceMetadata?: SpliceToken;
}) => {
  const { metadata } = nft;
  //console.log(metadata?.attributes);
  return (
    <Flex direction="column" gridGap={3}>
      <MetaDataItem label="collection" value={collection} />
      <MetaDataItem label="token id" value={tokenId} />
      <MetaDataItem label="randomness" value={randomness} />
      {spliceMetadata && (
        <MetaDataItem
          label="CID"
          value={spliceMetadata.ipnft}
          link={spliceMetadata.url}
        />
      )}
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
