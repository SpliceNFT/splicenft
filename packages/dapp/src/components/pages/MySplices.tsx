import {
  Alert,
  Container,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  NFTMetaData,
  resolveImage,
  SpliceNFT,
  TokenMetadataResponse
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { SpliceArtwork } from '../molecules/Splice/SpliceArtwork';
import { SpliceMetadataDisplay } from '../organisms/MetaDataDisplay';

const SpliceCardDisplay = ({
  mySplice
}: {
  mySplice: TokenMetadataResponse;
}) => {
  const { indexer, splice } = useSplice();
  const toast = useToast();

  const [origin, setOrigin] = useState<NFTMetaData | null>();
  const [metadata, setMetadata] = useState<SpliceNFT>();

  useEffect(() => {
    if (!splice) return;
    (async () => {
      try {
        setMetadata(await splice.fetchMetadata(mySplice.metadataUrl));
      } catch (e: any) {
        toast({
          status: 'error',
          title: 'failed loading metadata for splice ' + mySplice.tokenId
        });
      }
    })();
  }, [splice]);

  useEffect(() => {
    if (!indexer || !metadata) return;
    (async () => {
      const { origin_collection, origin_token_id } = metadata.splice;
      setOrigin(
        await indexer.getAssetMetadata(origin_collection, origin_token_id)
      );
    })();
  }, [indexer, metadata]);

  return (
    <Flex gridGap={2} flexDirection={['column', null, null, 'row']}>
      <LinkBox as={Flex} flex="2">
        {metadata && origin && (
          <LinkOverlay
            as={NavLink}
            to={`/nft/${metadata.splice.origin_collection}/${metadata.splice.origin_token_id}`}
          >
            <SpliceArtwork
              originImageUrl={resolveImage(origin)}
              spliceImageUrl={resolveImage(metadata)}
            />
          </LinkOverlay>
        )}
      </LinkBox>

      <Flex gridGap={2} direction="column" flex="1" p={3}>
        <Heading size="md">Splice #{mySplice.tokenId}</Heading>

        {metadata && (
          <>
            <Text>{metadata.description}</Text>
            <SpliceMetadataDisplay spliceMetadata={metadata} />
          </>
        )}
      </Flex>
    </Flex>
  );
};

export const MySplicesPage = () => {
  const { account, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();
  const [buzy, setBuzy] = useState<boolean>(false);

  const [splices, setSplices] = useState<TokenMetadataResponse[]>([]);

  useEffect(() => {
    if (!account || !splice) return;
    (async () => {
      setBuzy(true);
      setSplices(await splice.getAllSplices(account));
      setBuzy(false);
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
        {splices.map((spliceResult: TokenMetadataResponse) => (
          <Flex
            bg="white"
            w="100%"
            direction="row"
            key={`splice-${spliceResult.tokenId}`}
          >
            <SpliceCardDisplay mySplice={spliceResult} />
          </Flex>
        ))}
      </VStack>
    </Container>
  );
};
