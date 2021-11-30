import {
  AspectRatio,
  Flex,
  Heading,
  LinkOverlay,
  Text
} from '@chakra-ui/react';
import {
  NFTItemInTransit,
  NFTMetaData,
  TokenProvenance
} from '@splicenft/common';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { truncateAddress } from '../../modules/strings';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';

export const NFTCard = ({ nft }: { nft: NFTItemInTransit }) => {
  const [provenances, setProvenances] = useState<TokenProvenance[]>([]);
  const [nftMetadata, setNftMetadata] = useState<NFTMetaData>();
  const [nftImageUrl, setNftImageUrl] = useState<string>();
  const { splice } = useSplice();

  useEffect(() => {
    (async () => {
      try {
        if (nft.cached_file_url) {
          setNftImageUrl(nft.cached_file_url);
        }
        const _metadata = await nft.metadata;
        if (_metadata) {
          setNftMetadata(_metadata);
        }
      } catch (e: any) {
        console.error('error loading metadata', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!splice) return;
    (async () => {
      //todo: too expensive here.
      // setProvenances(
      //   await splice.findProvenances(nft.contract_address, nft.token_id)
      // );
    })();
  }, [splice]);

  return (
    <SpliceCard flexDirection="column">
      <AspectRatio ratio={1}>
        <FallbackImage imgUrl={nftImageUrl} metadata={nftMetadata} />
      </AspectRatio>
      <Flex direction="column" flex="1">
        <LinkOverlay
          as={Link}
          to={`/nft/${nft.contract_address}/${nft.token_id}`}
          p={4}
          background="white"
        >
          {nftMetadata && <Heading size="md">{nftMetadata.name}</Heading>}
        </LinkOverlay>

        <Flex background="black" direction="row" p={6}>
          <Flex
            direction="row"
            align="center"
            justify="space-between"
            width="100%"
          >
            <Flex direction="column">
              <Text color="gray.200" fontWeight="bold">
                contract
              </Text>
              <Text color="white">{truncateAddress(nft.contract_address)}</Text>
            </Flex>

            {provenances.length > 0 && (
              <Flex direction="column">
                <Text color="white">Minted {provenances.length}</Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </SpliceCard>
  );
};
