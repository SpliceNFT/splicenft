import { Divider, Flex, Link, Text } from '@chakra-ui/react';
import { ipfsGW, NFTMetaData, SpliceNFT } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React from 'react';

const MetaDataItem = ({
  label,
  value,
  link,
  color,
  fontSize = 'md'
}: {
  label: string;
  value: string | number;
  link?: string | undefined | null;
  color?: string | undefined;
  fontSize?: string;
}) => {
  return (
    <Flex
      direction="row"
      justify="space-between"
      gridGap={5}
      fontSize={fontSize}
    >
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
  owner,
  spliceMetadata
}: {
  owner: string | undefined;
  spliceMetadata: SpliceNFT;
}) => {
  const { account } = useWeb3React();

  const splMetaDataProps: Record<string, any> = spliceMetadata.properties
    ? spliceMetadata.properties
    : {};
  return (
    <>
      <MetaDataItem
        label="Owner"
        value={!owner ? '' : owner === account ? 'You' : owner}
      />
      <MetaDataItem
        label="Metadata"
        value={spliceMetadata.external_url || ''}
        link={spliceMetadata.external_url}
      />

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
      <Divider />
      {nftMetadata.attributes?.map((attr) => {
        return (
          <MetaDataItem
            fontSize="sm"
            key={`attr-${attr.trait_type}`}
            label={attr.trait_type}
            value={attr.value}
          />
        );
      })}
    </Flex>
  );
};
