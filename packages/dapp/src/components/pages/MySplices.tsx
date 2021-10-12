import { Alert, Box, Container, useToast, VStack } from '@chakra-ui/react';
import { NFTItem, Splice, SPLICE_ADDRESSES } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { NFTCard } from '../molecules/NFTCard';

export const MySplicesPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splices, setSplices] = useState<NFTItem[]>();
  const toast = useToast();

  // const fetchAssets = async (splice: Splice, _account: string) => {
  //   splice.getAllSplices(_account);
  // };

  useEffect(() => {
    (async () => {
      try {
        //await fetchAssets(account);
        toast({
          status: 'success',
          title: 'fetched all assets'
        });
      } catch (e) {
        toast({
          status: 'error',
          title: "couldn't fetch assets"
        });
      }
    })();
  }, [account]);

  return splices ? (
    <Container maxW="container.xl">
      {splices.length === 0 && (
        <Alert status="info">
          You don't have any Splices on chain {chainId}
        </Alert>
      )}
      <VStack>
        {splices.map((nft) => (
          <NFTCard key={`${nft.contract_address}/${nft.token_id}`} nft={nft} />
        ))}
      </VStack>
    </Container>
  ) : (
    <Box>loading</Box>
  );
};
