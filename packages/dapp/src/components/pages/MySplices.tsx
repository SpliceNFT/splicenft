import {
  Alert,
  Box,
  Circle,
  Container,
  Flex,
  Heading,
  Image,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { NFTItem, resolveImage, SpliceNFT } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSplice } from '../../context/SpliceContext';
import { DominantColorsDisplay } from '../molecules/DominantColors';

type MySplice = {
  tokenId: number;
  metadata: SpliceNFT;
};

const SpliceArtwork = ({ metadata }: { metadata: SpliceNFT }) => {
  const { indexer } = useSplice();
  const [origin, setOrigin] =
    useState<{ nftItem: NFTItem; imageUrl: string }>();
  useEffect(() => {
    if (!indexer) return;
    (async () => {
      const { origin_collection, origin_token_id } = metadata.properties;
      const nftItem = await indexer.getAssetMetadata(
        origin_collection,
        origin_token_id
      );
      setOrigin({
        nftItem,
        imageUrl: nftItem.metadata ? resolveImage(nftItem.metadata) : ''
      });
    })();
  }, [indexer]);
  return (
    <Flex position="relative">
      <Image src={resolveImage(metadata)} />

      {origin?.imageUrl && (
        <Box position="absolute" width="100%" height="100%">
          <Circle size="150px" bottom="-10%" position="absolute" left="10px">
            <Image
              src={origin.imageUrl}
              rounded="full"
              border="4px solid white"
            />
          </Circle>
        </Box>
      )}
    </Flex>
  );
};

export const MySplicesPage = () => {
  const { account, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();

  const [splices, setSplices] = useState<MySplice[]>([]);
  const toast = useToast();

  const fetchAssets = async () => {
    if (!splice || !account) return;

    const _spl = await splice.getAllSplices(account);

    setSplices(_spl);
  };

  useEffect(() => {
    if (!account || !splice) return;
    (async () => {
      try {
        await fetchAssets();
        toast({
          status: 'success',
          title: 'fetched all splices'
        });
      } catch (e) {
        toast({
          status: 'error',
          title: "couldn't fetch splices"
        });
      }
    })();
  }, [splice, account]);

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      {splices.length === 0 && (
        <Alert status="info">
          You don't have any Splices on chain {chainId}
        </Alert>
      )}
      <VStack gridGap={10}>
        {splices.map((spliceResult) => (
          <Flex
            bg="white"
            w="100%"
            direction="row"
            key={`splice-${spliceResult.tokenId}`}
          >
            <Flex w="75%">
              <SpliceArtwork metadata={spliceResult.metadata} />
            </Flex>
            <Flex p={3} direction="column" gridGap={3}>
              <Heading size="sm">{spliceResult.metadata.name}</Heading>
              <Text>
                <b>Randomness</b> {spliceResult.metadata.properties.randomness}
              </Text>
              <Text>
                <b>Style</b> {spliceResult.metadata.properties.style}
              </Text>
              <Flex gridGap={2} align="center">
                <b>Colors</b>
                <DominantColorsDisplay
                  colors={spliceResult.metadata.properties.colors}
                />
              </Flex>
            </Flex>
          </Flex>
        ))}
      </VStack>
    </Container>
  );
};
