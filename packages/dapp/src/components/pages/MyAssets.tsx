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
import {
  CHAINS,
  getAllAssetsOfOwner,
  getNFT,
  ChainOpt
} from '../../modules/chain';
//import { getNFTs } from '@splicenft/common/src/extractors/nftport';

import { NFTItem, Splice, SPLICE_ADDRESSES, NFTPort } from '@splicenft/common';
import { NFTCard } from '../molecules/NFTCard';
import { MintButton } from '../molecules/MintButton';

export const MyAssetsPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  const [loading, setLoading] = useState<boolean>(false);

  const [nfts, setNFTs] = useState<NFTItem[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (!library || !chainId) return;
    const splAddress =
      chainId === 31337
        ? (process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string)
        : SPLICE_ADDRESSES[chainId];

    if (splAddress) {
      const spl = Splice.from(splAddress, library.getSigner());
      setSplice(spl);
    }
  }, [library, chainId]);

  const onNFTMinted = async (collection: string, tokenId: string) => {
    if (!library) return;
    const nftItem = await getNFT({
      collection,
      tokenId,
      provider: library
    });
    setNFTs([...nfts, nftItem]);
  };

  //todo: either use global state or cache the assets somehow.
  const fetchAssets = async (
    address: string,
    chain: ChainOpt,
    library: providers.BaseProvider
  ) => {
    let _nfts: NFTItem[];
    switch (chain) {
      //I would use Covalent here but it's SO unreliable
      //that I'm not doing that.
      case 'ethereum':
        _nfts = await NFTPort.getNFTs({ address, chain });
        break;

      default:
        _nfts = await getAllAssetsOfOwner({
          ownerAddress: address,
          provider: library,
          chain
        });
    }

    setNFTs(_nfts.filter((n) => n.metadata !== null));
  };

  useEffect(() => {
    if (!account || !library || !chainId) return;

    (async () => {
      try {
        const chain = CHAINS[chainId];
        if (!chain) throw `chain ${chainId} unsupported`;
        setLoading(true);
        await fetchAssets(account, chain, library);
        toast({
          status: 'success',
          title: 'fetched all assets'
        });
      } catch (e) {
        toast({
          status: 'error',
          title: `couldn't fetch assets ${e}`
        });
      }
      setLoading(false);
    })();
  }, [account, chainId]);

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      {loading ? (
        'loading'
      ) : nfts.length === 0 ? (
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
          {nfts.map((nft) => (
            <NFTCard
              key={`${nft.contract_address}/${nft.token_id}`}
              nft={nft}
              splice={splice}
            />
          ))}
          <Flex
            background="gray.200"
            width="100%"
            minH="80"
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
