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
import { useAssets } from '../../context/AssetContext';
import { useSplice } from '../../context/SpliceContext';
import { truncateAddress } from '../../modules/strings';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';

export const NFTCard = ({ nft }: { nft: NFTItemInTransit }) => {
  const [provenance, setProvenance] = useState<TokenProvenance>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();
  const [nftMetadata, setNftMetadata] = useState<NFTMetaData>();
  const [nftImageUrl, setNftImageUrl] = useState<string>();
  const [contractName, setContractName] = useState<string>();
  const { splice, spliceStyles } = useSplice();
  const { getContractName } = useAssets();

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
    (async () => {
      setContractName(await getContractName(nft.contract_address));
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
      <AspectRatio ratio={1} flex="3">
        {spliceMetadata ? (
          <Flex position="relative">
            <Image src={spliceMetadata.image} fit="cover" boxSize="100%" />
            <Center position="absolute" width="100%" height="100%">
              <Flex
                rounded="full"
                border="4px solid white"
                w="70%"
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
      <Flex direction="column" flex="2">
        <LinkOverlay
          as={Link}
          to={`/nft/${nft.contract_address}/${nft.token_id}`}
          p={4}
          background="white"
        >
          <Heading size="md">
            {nftMetadata ? nftMetadata.name : nft.name}
          </Heading>
        </LinkOverlay>

        <Flex
          background="black"
          gridGap={1}
          direction="column"
          align="flex-start"
          justify="center"
          flex="2"
          p={4}
        >
          <Text color="white" fontSize="sm">
            {contractName || truncateAddress(nft.contract_address)}
          </Text>

          {provenance && (
            <Text color="white" fontSize="sm">
              {
                spliceStyles
                  .find((st) => st.tokenId === provenance.style_token_id)
                  ?.getMetadata().name
              }{' '}
              # {provenance.style_token_token_id}
            </Text>
          )}
        </Flex>
      </Flex>
    </SpliceCard>
  );
};
