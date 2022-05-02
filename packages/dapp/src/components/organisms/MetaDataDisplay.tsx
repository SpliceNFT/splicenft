import { Flex, Heading, Link, SystemProps, Text } from '@chakra-ui/react';
import {
  ipfsGW,
  NFTMetaData,
  NFTTrait,
  SpliceNFT,
  SPLICE_ADDRESSES,
  TokenProvenance
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React from 'react';
import { DominantColorsDisplay } from '../molecules/DominantColors';

export const MetaDataItem = ({
  label,
  value,
  link,
  color,
  fontSize = 'md'
}: {
  label: string;
  value: string | number | React.ReactNode;
  link?: string | undefined | null;
  color?: string | undefined;
  fontSize?: string;
}) => {
  return (
    <Flex
      direction={['column', 'row']}
      align={['start', 'center']}
      justify="space-between"
      gridGap={[null, 5]}
      fontSize={fontSize}
    >
      <Text fontWeight="bold">{label}</Text>

      {link ? (
        <Text isTruncated>
          <Link href={ipfsGW(link)} isExternal>
            {value}
          </Link>
        </Text>
      ) : 'string' === typeof value ? (
        <Text fontWeight="normal" textColor={color} isTruncated>
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  );
};

export const SpliceMetadataDisplay = ({
  owner,
  spliceMetadata,
  provenance,
  traits,
  ...rest
}: {
  owner?: string;
  spliceMetadata?: SpliceNFT;
  provenance?: TokenProvenance | null;
  traits?: NFTTrait[];
} & SystemProps) => {
  const { account } = useWeb3React();

  if (!owner && !spliceMetadata && (!traits || traits.length === 0))
    return <></>;
  else
    return (
      <Flex direction="column" {...rest}>
        <Flex direction="column" gridGap={3}>
          {owner && (
            <MetaDataItem
              label="Owner"
              value={owner === account ? 'You' : owner}
            />
          )}
          {spliceMetadata && (
            <>
              <MetaDataItem
                label="Style"
                value={spliceMetadata.properties.style_name}
              />
              <MetaDataItem
                label="Randomness"
                value={spliceMetadata.splice.randomness}
              />
              <MetaDataItem
                label="Colors"
                value={
                  <DominantColorsDisplay
                    colors={spliceMetadata.splice.colors}
                  />
                }
              />
            </>
          )}
          {provenance && (
            <MetaDataItem
              label="Splice ID"
              value={`${provenance.splice_token_id.toString()} (${
                provenance.style_token_token_id
              } of ${provenance.style_token_id})`}
            />
          )}
        </Flex>
        {traits && traits.length > 0 && (
          <>
            <Heading size="md" mb={3} mt={spliceMetadata ? 3 : 0}>
              Splice attributes
            </Heading>
            <Flex direction="column" gridGap={3}>
              {traits?.map((attr, i) => (
                <MetaDataItem
                  fontSize="sm"
                  key={`attr-${attr.trait_type || `unk-${i}`}`}
                  label={attr.trait_type || `unknown trait`}
                  value={attr.value}
                />
              ))}
            </Flex>
          </>
        )}
      </Flex>
    );
};

export const OriginMetadataDisplay = ({
  nftMetadata,
  contractAddress,
  owner,
  tokenId,
  randomness
}: {
  nftMetadata: NFTMetaData;
  randomness: number;
  owner?: string;
  contractAddress: string;
  tokenId: string | number;
}) => {
  const { chainId, account } = useWeb3React();

  const deployInfo = chainId ? SPLICE_ADDRESSES[chainId] : null;

  //some collections might return attributes as object :roll_eyes:
  //https://opensea.io/assets/0x031920cc2d9f5c10b444fd44009cd64f829e7be2/13318
  //todo: move this to the indexers
  const attributes = nftMetadata.attributes;

  const _attrs = attributes?.map ? attributes : [];
  return (
    <Flex direction="column" gridGap={3}>
      <MetaDataItem label="collection" value={contractAddress} />
      <MetaDataItem label="token id" value={tokenId} />
      <MetaDataItem label="randomness" value={randomness} />
      <MetaDataItem
        label="owner"
        value={owner === account ? 'You' : account}
        link={
          deployInfo
            ? `//${deployInfo.openSeaRoot}/${contractAddress}/${tokenId}}`
            : undefined
        }
      />
      {_attrs.map((attr, i) => {
        return (
          <MetaDataItem
            fontSize="sm"
            key={`attr-${attr.trait_type || `unk-${i}`}`}
            label={attr.trait_type || `unknown trait`}
            value={attr.value}
          />
        );
      })}
    </Flex>
  );
};
