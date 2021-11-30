import { useQuery } from '@apollo/client';
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
  ipfsGW,
  NFTMetaData,
  resolveImage,
  SpliceNFT,
  Transfer
} from '@splicenft/common';
import { fetchMetadataFromUrl } from '@splicenft/common/build/indexers/NFTIndexer';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import {
  UserSplicesData,
  UserSplicesVars,
  USER_SPLICES
} from '../../modules/Queries';
import { SpliceArtwork } from '../molecules/Splice/SpliceArtwork';
import { SpliceMetadataDisplay } from '../organisms/MetaDataDisplay';

const SpliceCardDisplay = ({ mySplice }: { mySplice: Transfer.UserSplice }) => {
  const { indexer, splice } = useSplice();
  const toast = useToast();

  const [origin, setOrigin] = useState<NFTMetaData | null>();
  const [metadata, setMetadata] = useState<SpliceNFT>();

  useEffect(() => {
    if (!splice || !indexer) return;
    (async () => {
      try {
        const spliceMetadata = await splice.fetchMetadata(
          mySplice.metadata_url
        );
        setMetadata(spliceMetadata);
        if (mySplice.origin_metadata_url) {
          fetchMetadataFromUrl(
            ipfsGW(mySplice.origin_metadata_url),
            process.env.REACT_APP_CORS_PROXY
          ).then(setOrigin);
        } else {
          const { origin_collection, origin_token_id } = spliceMetadata.splice;
          indexer
            .getAssetMetadata(origin_collection, origin_token_id)
            .then(setOrigin);
        }
      } catch (e: any) {
        toast({
          status: 'error',
          title: 'failed loading metadata for splice ' + mySplice.id
        });
      }
    })();
  }, [indexer, splice]);

  return (
    <Flex bg="white" w="100%" direction="row">
      <Flex gridGap={2} flexDirection={['column', null, null, 'row']}>
        <LinkBox as={Flex} w={[null, null, null, '66%']}>
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

        <Flex
          gridGap={2}
          direction="column"
          w={[null, null, null, '33%']}
          p={3}
        >
          <Heading size="md">Splice #{mySplice.id}</Heading>

          {metadata && (
            <>
              <Text>{metadata.description}</Text>
              <SpliceMetadataDisplay spliceMetadata={metadata} />
            </>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

const GenericSpliceList = ({
  splices,
  buzy
}: {
  splices: Transfer.UserSplice[];
  buzy: boolean;
}) => {
  return splices.length === 0 && !buzy ? (
    <Alert status="info">You don't have any Splices</Alert>
  ) : (
    <VStack gridGap={10}>
      {splices.map((splice: Transfer.UserSplice) => (
        <SpliceCardDisplay mySplice={splice} key={`splice-${splice.id}`} />
      ))}
    </VStack>
  );
};

const ChainSpliceList = ({ account }: { account: string }) => {
  const [buzy, setBuzy] = useState<boolean>(false);
  const { splice } = useSplice();
  const [splices, setSplices] = useState<Transfer.UserSplice[]>([]);

  useEffect(() => {
    if (!splice) return;
    console.log(`getting all splices from chain`);
    (async () => {
      setBuzy(true);
      setSplices(await splice.getAllSplices(account));
      setBuzy(false);
    })();
  }, [splice]);

  return <GenericSpliceList splices={splices} buzy={buzy} />;
};

const SubgraphSpliceList = ({ account }: { account: string }) => {
  const {
    loading: buzy,
    error: gqlErr,
    data: splices
  } = useQuery<UserSplicesData, UserSplicesVars>(USER_SPLICES, {
    variables: { owner: account }
  });

  return <GenericSpliceList splices={splices?.spliceice || []} buzy={buzy} />;
};

export const MySplicesPage = () => {
  const { account, chainId } = useWeb3React<providers.Web3Provider>();

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      {account && chainId ? (
        [1, 4].includes(chainId) ? (
          <SubgraphSpliceList account={account} />
        ) : (
          <ChainSpliceList account={account} />
        )
      ) : (
        <Alert status="info">We're loading your splices, standby.</Alert>
      )}
    </Container>
  );
};
