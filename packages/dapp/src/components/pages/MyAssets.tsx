import { Container, SimpleGrid, Box } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CHAINS, getAllAssetsOfOwner } from '../../modules/chain';
import { getNFTs } from '../../modules/nftport';
import * as Splice from '../../modules/splice';
import { NFTItem } from '../../types/NFTPort';
import { NFTCard } from '../molecules/NFTCard';

export const MyAssetsPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();

  const [nfts, setNFTs] = useState<NFTItem[]>();

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
    fetchAssets();
  }, [account, chainId]);

  return nfts ? (
    <Container maxW="container.xl">
      <SimpleGrid columns={[2, null, 3]} spacingX="40px" spacingY="20px">
        {nfts.map((nft) => (
          <NFTCard key={`${nft.contract_address}/${nft.token_id}`} nft={nft} />
        ))}
      </SimpleGrid>
    </Container>
  ) : (
    <Box>loading</Box>
  );
};
