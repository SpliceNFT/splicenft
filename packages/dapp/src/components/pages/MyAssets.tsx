import {
  Container,
  SimpleGrid,
  Flex,
  useToast,
  Alert,
  AlertTitle
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CHAINS, getAllAssetsOfOwner, getNFT } from '../../modules/chain';
import { getNFTs } from '../../modules/nftport';

import { NFTItem, Splice, SPLICE_ADDRESSES } from '@splicenft/common';
import { NFTCard } from '../molecules/NFTCard';
import { MintButton } from '../molecules/MintButton';

export const MyAssetsPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();

  const [nfts, setNFTs] = useState<NFTItem[]>([]);
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

  const onNFTMinted = async (collection: string, tokenId: string) => {
    if (!library) return;
    const nftItem = await getNFT({
      collection,
      tokenId,
      provider: library
    });
    setNFTs([...nfts, nftItem]);
  };

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

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      {nfts.length === 0 ? (
        <Alert status="info">
          <Flex
            align="center"
            direction="row"
            justify="space-between"
            width="100%"
          >
            <AlertTitle>
              it seems you don't have any assets on chain {chainId}{' '}
            </AlertTitle>

            <MintButton onMinted={onNFTMinted} />
          </Flex>
        </Alert>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacingX={5} spacingY="20px">
          {splice &&
            nfts.map((nft) => (
              <NFTCard
                key={`${nft.contract_address}/${nft.token_id}`}
                nft={nft}
                splice={splice}
              />
            ))}
          <Flex
            background="gray.200"
            width="100%"
            rounded="lg"
            align="center"
            justify="center"
          >
            <MintButton onMinted={onNFTMinted} />
          </Flex>
        </SimpleGrid>
      )}
    </Container>
  );
};
