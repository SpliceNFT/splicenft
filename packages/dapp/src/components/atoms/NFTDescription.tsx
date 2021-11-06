import {
  Flex,
  Heading,
  Icon,
  Link,
  SkeletonText,
  Text
} from '@chakra-ui/react';
import { NFTMetaData, SpliceNFT, StyleNFT } from '@splicenft/common';
import React from 'react';
import { FaTwitter } from 'react-icons/fa';

export const NFTDescription = ({
  nftMetadata,
  styleNFT,
  spliceMetadata
}: {
  nftMetadata?: NFTMetaData;
  styleNFT?: StyleNFT;
  spliceMetadata?: SpliceNFT;
}) => {
  const props = styleNFT?.splice;
  return (
    <Flex direction="column" pt={6}>
      {styleNFT && (
        <Flex direction="column" mb={12}>
          <Heading size="xl" mb={2}>
            {spliceMetadata ? spliceMetadata.name : styleNFT.name}
          </Heading>
          <Text>
            {spliceMetadata?.description} {styleNFT.description}
          </Text>
          <Flex my={4} py={2}>
            {props && (
              <Flex direction="column" gridGap={2}>
                <Flex gridGap={3} align="center">
                  <Text>Artist: </Text>
                  {props.creator_url ? (
                    <Link fontWeight="bold" href={props.creator_url} isExternal>
                      {props.creator_name}
                    </Link>
                  ) : (
                    <Text>{props.creator_name}</Text>
                  )}
                  {props.creator_twitter && (
                    <Link href={props.creator_twitter} isExternal>
                      <Icon
                        as={FaTwitter}
                        boxSize="5"
                        color="twitter.500"
                        title={props.creator_twitter}
                      />
                    </Link>
                  )}
                </Flex>
                <Flex gridGap={3}>
                  <Text>
                    Built on: {props.code_library} {props.code_library_version}
                  </Text>
                  {props.license && <Text>{props.license}</Text>}
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
      )}

      {nftMetadata ? (
        <>
          <Heading size="md" mb={2}>
            {nftMetadata.name}
          </Heading>
          <Text fontSize="sm">{nftMetadata.description}</Text>
        </>
      ) : (
        <SkeletonText noOfLines={3} />
      )}
    </Flex>
  );
};
