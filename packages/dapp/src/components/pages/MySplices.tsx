import {
  Alert,
  Box,
  Circle,
  Container,
  Flex,
  Heading,
  Image,
  Text,
  Skeleton,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  ipfsGW,
  NFTMetaData,
  resolveImage,
  Splice,
  SpliceNFT
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSplice } from '../../context/SpliceContext';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';
import { DominantColorsDisplay } from '../molecules/DominantColors';

type MySplice = {
  tokenId: number;
  metadataUrl: string; //SpliceNFT;
};

const SpliceArtwork = ({ splice }: { splice: MySplice }) => {
  const { indexer } = useSplice();
  const [origin, setOrigin] =
    useState<{ nftMetadata: NFTMetaData; imageUrl: string }>();
  const [metadata, setMetadata] = useState<SpliceNFT>();

  useEffect(() => {
    if (!indexer) return;
    (async () => {
      const metadata = await (
        await axios.get(ipfsGW(splice.metadataUrl), {
          responseType: 'json'
        })
      ).data;
      setMetadata(metadata);
    })();
  }, [indexer]);

  useEffect(() => {
    if (!indexer || !metadata) return;
    (async () => {
      const { origin_collection, origin_token_id } = metadata.properties;
      const nftMetadata = await indexer.getAssetMetadata(
        origin_collection,
        origin_token_id
      );
      if (nftMetadata) {
        setOrigin({
          nftMetadata,
          imageUrl: resolveImage(nftMetadata)
        });
      }
    })();
  }, [indexer, metadata]);

  return (
    <SpliceCard direction="row">
      <Flex w="75%" position="relative" bg="transparent">
        {metadata ? (
          <Image src={resolveImage(metadata)} />
        ) : (
          <Box bg="grey.200" />
        )}
        <Box width="100%" height="100%">
          <Circle size="120px" bottom="10px" position="absolute" left="10px">
            {origin?.imageUrl && (
              <FallbackImage
                imgUrl={origin.imageUrl}
                rounded="full"
                border="4px solid white"
              />
            )}
          </Circle>
        </Box>
      </Flex>
      <Flex p={3} direction="column" gridGap={3}>
        {metadata ? (
          <>
            <Heading size="sm">{metadata.name}</Heading>
            <Text>
              <b>Randomness</b> {metadata.properties.randomness}
            </Text>
            <Text>
              <b>Style</b> {metadata.properties.style}
            </Text>
            <Text fontWeight="bold">Colors</Text>
            <DominantColorsDisplay colors={metadata.properties.colors} />
          </>
        ) : (
          <Skeleton h="20px">no metadata yet</Skeleton>
        )}
      </Flex>
    </SpliceCard>
  );
};

export const MySplicesPage = () => {
  const { account, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();
  const [buzy, setBuzy] = useState<boolean>(false);

  const [splices, setSplices] = useState<MySplice[]>([]);
  const toast = useToast();

  const fetchAssets = async (splice: Splice, account: string) => {
    setBuzy(true);
    const _spl = await splice.getAllSplices(account);
    setSplices(_spl);
    setBuzy(false);
  };

  useEffect(() => {
    if (!account || !splice) return;
    (async () => {
      try {
        await fetchAssets(splice, account);
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
      {!buzy && splices.length === 0 && (
        <Alert status="info">
          You don't have any Splices on chain {chainId}
        </Alert>
      )}
      {buzy && (
        <Alert status="info">We're loading your splices, standby.</Alert>
      )}
      <VStack gridGap={10}>
        {splices.map((spliceResult) => (
          <Flex
            bg="white"
            w="100%"
            direction="row"
            key={`splice-${spliceResult.tokenId}`}
          >
            <SpliceArtwork splice={spliceResult} />
          </Flex>
        ))}
      </VStack>
    </Container>
  );
};
