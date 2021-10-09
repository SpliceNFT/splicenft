import {
  Container,
  SimpleGrid,
  Box,
  useToast,
  VStack,
  Alert
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CHAINS, getAllAssetsOfOwner } from '../../modules/chain';
import { getNFTs } from '../../modules/nftport';

import { NFTItem, Splice, SPLICE_ADDRESSES } from '@splicenft/common';
import { NFTCard } from '../molecules/NFTCard';

export const MySplicesPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [splices, setSplices] = useState<NFTItem[]>();
  const toast = useToast();

  useEffect(() => {
    if (!library || !chainId) return;
    const splAddress =
      chainId === 31337
        ? (process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string)
        : SPLICE_ADDRESSES[chainId];

    const spl = Splice.from(splAddress, library.getSigner());

    setSplice(spl);
  }, [library]);

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
  }, [splice, account]);

  return splices ? (
    <Container maxW="container.xl">
      {splices.length === 0 && (
        <Alert status="info">
          You don't have any Splices on chain {chainId}
        </Alert>
      )}
      <VStack>
        {splice &&
          splices.map((nft) => (
            <NFTCard
              key={`${nft.contract_address}/${nft.token_id}`}
              nft={nft}
              splice={splice}
            />
          ))}
      </VStack>
    </Container>
  ) : (
    <Box>loading</Box>
  );
};
