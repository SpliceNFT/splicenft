import {
  Alert,
  AlertIcon,
  AlertTitle,
  Container,
  Flex,
  Text,
  Heading,
  Link,
  Button,
  SimpleGrid,
  useToast
} from '@chakra-ui/react';
import { CHAINS, NFTItemInTransit } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useSplice } from '../../context/SpliceContext';
import { MintButton } from '../molecules/MintButton';
import { NFTCard } from '../molecules/NFTCard';

export const MyAssetsPage = () => {
  const { accountAddress } =
    useParams<{ accountAddress: string | undefined }>();
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { indexer } = useSplice();
  const [balance, setBalance] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(0)
  );
  const [loading, setLoading] = useState<boolean>(false);

  const [nfts, setNFTs] = useState<NFTItemInTransit[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (!account || !indexer) return;
    (async () => {
      try {
        setLoading(true);
        //todo: either use global state or cache the assets somehow.
        if (indexer.canBeContinued()) {
          indexer.reset();
        }
        const _nfts = await indexer.getAllAssetsOfOwner(
          accountAddress || account
        );
        setNFTs(_nfts);
      } catch (e) {
        toast({
          status: 'error',
          title: `couldn't fetch assets ${e}`
        });
      }
      setLoading(false);
    })();
  }, [account, indexer]);

  useEffect(() => {
    if (!library || !account || !chainId) return;
    (async () => {
      setBalance(await library.getBalance(account));
    })();
  }, [library, account, chainId]);

  const continueLoading = async () => {
    const addr = accountAddress || account;
    if (!addr || !indexer) return;
    setLoading(true);
    const _moreNfts = await indexer.getAllAssetsOfOwner(addr);
    setNFTs([...nfts, ..._moreNfts]);

    setLoading(false);
  };
  const onNFTMinted = async (collection: string, tokenId: string) => {
    if (!library || !indexer) return;
    const newNft = await indexer.getAsset(collection, tokenId);

    if (newNft) {
      setNFTs([...nfts, newNft]);
    }
  };

  const switchToRinkeby = async () => {
    if (library?.provider.request) {
      library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4' }]
      });
    }
  };

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      {loading && (
        <Alert status="info">
          <AlertTitle>loading</AlertTitle>
        </Alert>
      )}
      {!chainId && (
        <Alert status="warning" variant="subtle">
          <AlertIcon />
          <AlertTitle>
            please connect with an Ethereum account (Rinkeby works best atm)
          </AlertTitle>
        </Alert>
      )}
      {!loading && chainId && nfts.length === 0 && (
        <Alert status="info" overflow="visible" mt={6}>
          <Flex
            align="center"
            direction="row"
            justify="space-between"
            width="100%"
          >
            <Flex>
              <AlertIcon />
              <AlertTitle>
                <Text>
                  It appears you don't have any NFTs on{' '}
                  {CHAINS[chainId] || `chain ${chainId}`}.{' '}
                  {chainId !== 0x4 && (
                    <>
                      You can test Splice for free{' '}
                      <Link onClick={switchToRinkeby} fontWeight="bold">
                        on Rinkeby
                      </Link>
                    </>
                  )}
                </Text>
              </AlertTitle>
            </Flex>
            {chainId !== 1 && (
              <MintButton onMinted={onNFTMinted} balance={balance} />
            )}
          </Flex>
        </Alert>
      )}

      {chainId && (
        <>
          {nfts.length > 0 && (
            <Heading size="md">Choose an NFT to splice</Heading>
          )}
          <SimpleGrid
            columns={[1, 2, 3, 4]}
            spacingX={5}
            spacingY="20px"
            mt={6}
          >
            {nfts.map((nft: NFTItemInTransit) => (
              <NFTCard
                key={`${nft.contract_address}/${nft.token_id}`}
                nft={nft}
              />
            ))}
            {chainId !== 1 && (
              <Flex
                background="gray.200"
                width="100%"
                minH="80"
                rounded="lg"
                align="center"
                justify="center"
              >
                <MintButton onMinted={onNFTMinted} balance={balance} />
              </Flex>
            )}
            {indexer?.canBeContinued() && (
              <Flex width="100%" minH="80" align="center" justify="center">
                <Button onClick={continueLoading}>load more</Button>
              </Flex>
            )}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
};
