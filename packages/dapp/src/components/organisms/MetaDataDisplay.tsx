import React from 'react';
import { NFTItem, NFTMetaData } from '@splicenft/common';
import { Flex, Text, Link } from '@chakra-ui/react';
import { SpliceToken } from '../../types/SpliceToken';

const MetaDataItem = ({
  label,
  value,
  link,
  color
}: {
  label: string;
  value: string | number;
  link?: string | undefined;
  color?: string | undefined;
}) => {
  return (
    <Flex direction="row" justify="space-between" gridGap={5}>
      <Text fontWeight="bold">{label}</Text>
      <Text fontWeight="normal" textColor={color} isTruncated>
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
  isCollectionAllowed,
  tokenId,
  randomness,
  spliceToken,
  spliceMetadata
}: {
  nft: NFTItem;
  collection: string;
  isCollectionAllowed?: boolean;
  tokenId: string;
  randomness: number;
  spliceToken?: SpliceToken;
  spliceMetadata?: NFTMetaData;
}) => {
  const { metadata } = nft;

  const splMetaDataProps: Record<string, any> = spliceMetadata?.properties
    ? spliceMetadata.properties
    : {};

  return (
    <Flex direction="column" gridGap={3}>
      <MetaDataItem
        label="collection"
        value={collection}
        color={isCollectionAllowed === false ? 'red' : undefined}
      />
      <MetaDataItem label="token id" value={tokenId} />
      <MetaDataItem label="randomness" value={randomness} />
      {spliceToken && (
        <MetaDataItem
          label="CID"
          value={spliceToken.ipnft}
          link={spliceToken.url}
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
      {spliceMetadata?.properties && (
        <Flex bg="gray.100" direction="column" gridGap={3} p={3}>
          {Object.keys(splMetaDataProps).map((prop) => {
            const val = splMetaDataProps[prop];
            return (
              <MetaDataItem key={`prop-${prop}`} label={prop} value={val} />
            );
          })}
        </Flex>
      )}
    </Flex>
  );
};
