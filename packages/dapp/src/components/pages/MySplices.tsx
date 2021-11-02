import {
  Alert,
  Container,
  Flex,
  LinkBox,
  LinkOverlay,
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
import { SpliceCard } from '../atoms/SpliceCard';
import { SpliceArtwork } from '../molecules/Splice/SpliceArtwork';
import { SpliceMetadata } from '../molecules/Splice/SpliceMetadataDisplay';

type MySplice = {
  tokenId: string;
  metadataUrl: string; //SpliceNFT;
};

const SpliceCardDisplay = ({ mySplice }: { mySplice: MySplice }) => {
  const { indexer } = useSplice();
  const [origin, setOrigin] =
    useState<{ nftMetadata: NFTMetaData; imageUrl: string }>();
  const [metadata, setMetadata] =
    useState<{ metadata: SpliceNFT; imageUrl: string }>();

  const toast = useToast();
  useEffect(() => {
    (async () => {
      try {
        const _metadata = await (
          await axios.get<SpliceNFT>(ipfsGW(mySplice.metadataUrl), {
            responseType: 'json'
          })
        ).data;

        setMetadata({
          metadata: _metadata,
          imageUrl: resolveImage(_metadata)
        });
      } catch (e: any) {
        toast({
          status: 'error',
          title: 'failed loading metadata for splice ' + mySplice.tokenId
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!indexer || !metadata) return;
    (async () => {
      const { origin_collection, origin_token_id } =
        metadata.metadata.properties;
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
    <SpliceCard direction={['column', null, null, 'row']}>
      <LinkBox as={Flex}>
        <LinkOverlay href={metadata?.imageUrl || ''} isExternal>
          <SpliceArtwork
            originImageUrl={origin?.imageUrl}
            spliceImageUrl={metadata?.imageUrl}
          />
        </LinkOverlay>
      </LinkBox>
      <SpliceMetadata
        tokenId={mySplice.tokenId}
        metadata={metadata?.metadata}
        metadataUrl={mySplice.metadataUrl}
      ></SpliceMetadata>
    </SpliceCard>
  );
};

export const MySplicesPage = () => {
  const { account, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();
  const [buzy, setBuzy] = useState<boolean>(false);

  const [splices, setSplices] = useState<MySplice[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (!account || !splice) return;
    (async () => {
      try {
        setBuzy(true);
        const _spl = await splice.getAllSplices(account);

        setSplices(_spl);
        setBuzy(false);
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
        {splices.map((spliceResult: MySplice) => (
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
