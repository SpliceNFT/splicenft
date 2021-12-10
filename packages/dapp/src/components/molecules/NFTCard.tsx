import {
  AspectRatio,
  Center,
  Flex,
  Heading,
  Image,
  LinkOverlay,
  Text
} from '@chakra-ui/react';
import {
  NFTItemInTransit,
  NFTMetaData,
  SpliceNFT,
  TokenProvenance
} from '@splicenft/common';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { truncateAddress } from '../../modules/strings';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';

export const NFTCard = ({ nft }: { nft: NFTItemInTransit }) => {
  const [provenance, setProvenance] = useState<TokenProvenance>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();
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
      const _provenances = await splice.findProvenances(
        nft.contract_address,
        nft.token_id
      );
      if (_provenances.length > 0) {
        setProvenance(_provenances[0]);
      }
    })();
  }, [splice]);
  useEffect(() => {
    if (!splice || !provenance) return;
    (async () => {
      setSpliceMetadata(await splice.getMetadata(provenance));
    })();
  }, [splice, provenance]);
  return (
    <SpliceCard flexDirection="column">
      <AspectRatio ratio={1}>
        {spliceMetadata ? (
          <Flex position="relative" overflow="hidden">
            <Image src={spliceMetadata.image} fit="cover" boxSize="100%" />
            <Center position="absolute" width="100%" height="100%">
              <Flex
                rounded="full"
                border="4px solid white"
                w="75%"
                overflow="hidden"
                boxShadow="md"
              >
                <FallbackImage imgUrl={nftImageUrl} metadata={nftMetadata} />
              </Flex>
            </Center>
          </Flex>
        ) : (
          <FallbackImage imgUrl={nftImageUrl} metadata={nftMetadata} />
        )}
      </AspectRatio>
      <Flex direction="column" flex="1">
        <LinkOverlay
          as={Link}
          to={`/nft/${nft.contract_address}/${nft.token_id}`}
          p={4}
          background="white"
          flex="2"
        >
          <Heading size="md" flex="1">
            {nftMetadata ? nftMetadata.name : nft.name}
          </Heading>
        </LinkOverlay>

        <Flex background="black" direction="row" p={6} flex="2">
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

            {provenance && (
              <Flex direction="column">
                <Text color="gray.200" fontWeight="bold">
                  Splice
                </Text>

                <Text color="white">
                  {provenance.style_token_id}/{provenance.style_token_token_id}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </SpliceCard>
  );
};
