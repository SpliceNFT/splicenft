import { Container, SimpleGrid, Box, useToast, Alert } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CHAINS, getAllAssetsOfOwner } from '../../modules/chain';
import { getNFTs } from '../../modules/nftport';

import { NFTItem } from '../../types/NFTPort';
import { NFTCard } from '../molecules/NFTCard';

export const MyAssetsPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();

  const [nfts, setNFTs] = useState<NFTItem[]>();
  const toast = useToast();
  const fetchAssets = async () => {
    //todo: either use global state or cache the assets somehow.

    if (!account || !library || !chainId) return;
    let _nfts: NFTItem[];
    if (chainId !== 1) {
      _nfts = await getAllAssetsOfOwner({
        ownerAddress: account,
        provider: library,
        chain: CHAINS[chainId]
      });
    } else {
      _nfts = await getNFTs({ address: account, chain: 'ethereum' });
    }
    setNFTs(_nfts.filter((n) => n.metadata !== null));
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchAssets();
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
  }, [account, chainId]);

  return nfts ? (
    <Container maxW="container.xl">
      {nfts.length === 0 && (
        <Alert status="info">
          it seems you don't have any assets on chain {chainId}{' '}
        </Alert>
      )}
      <SimpleGrid columns={[1, 2, 3]} spacingX={5} spacingY="20px">
        {nfts.map((nft) => (
          <NFTCard key={`${nft.contract_address}/${nft.token_id}`} nft={nft} />
        ))}
      </SimpleGrid>
    </Container>
  ) : (
    <Box>loading</Box>
  );
};
