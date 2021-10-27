import { Flex, Link, Text } from '@chakra-ui/react';
import { ipfsGW, NFTMetaData } from '@splicenft/common';
import React from 'react';

const MetaDataItem = ({
  label,
  value,
  link,
  color
}: {
  label: string;
  value: string | number;
  link?: string | undefined | null;
  color?: string | undefined;
}) => {
  return (
    <Flex direction="row" justify="space-between" gridGap={5}>
      <Text fontWeight="bold">{label}</Text>
      <Text fontWeight="normal" textColor={color} isTruncated>
        {link ? (
          <Link href={ipfsGW(link)} isExternal>
            {value}
          </Link>
        ) : (
          value
        )}
      </Text>
    </Flex>
  );
};

export const SpliceMetadataDisplay = ({
  spliceMetadata,
  spliceMetadataCID
}: {
  spliceMetadata: NFTMetaData;
  spliceMetadataCID?: string;
}) => {
  const splMetaDataProps: Record<string, any> = spliceMetadata.properties
    ? spliceMetadata.properties
    : {};
  return (
    <>
      {spliceMetadataCID && (
        <MetaDataItem
          label="CID"
          value={spliceMetadataCID}
          link={spliceMetadata.external_url}
        />
      )}

      {Object.keys(splMetaDataProps).map((prop) => {
        const val = splMetaDataProps[prop];
        return <MetaDataItem key={`prop-${prop}`} label={prop} value={val} />;
      })}
    </>
  );
};

export const MetaDataDisplay = ({
  nftMetadata,
  contractAddress,
  tokenId,
  randomness
}: {
  nftMetadata: NFTMetaData;
  randomness: number;
  contractAddress: string;
  tokenId: string | number;
}) => {
  return (
    <Flex direction="column" gridGap={3}>
      <MetaDataItem label="collection" value={contractAddress} />
      <MetaDataItem label="token id" value={tokenId} />
      <MetaDataItem label="randomness" value={randomness} />

      {nftMetadata.attributes?.map((attr) => {
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
