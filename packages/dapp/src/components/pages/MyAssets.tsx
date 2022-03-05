import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Container,
  Flex,
  Heading,
  Link,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import { CHAINS, NFTItemInTransit } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { useAssets } from '../../context/AssetContext';
import ConnectAlert from '../molecules/ConnectAlert';
import { ImportNFT } from '../molecules/Create/ImportNFT';
import { MintButton } from '../molecules/MintButton';
import { NFTCard } from '../molecules/NFTCard';

export const MyAssetsPage = () => {
  const { accountAddress } =
    useParams<{ accountAddress: string | undefined }>();
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const history = useHistory();

  const {
    indexer,
    nfts,
    nftsLoading,
    continueLoading,
    onNFTAdded,
    setAccountAddress
  } = useAssets();

  const [balance, setBalance] = useState<ethers.BigNumber>(
    ethers.BigNumber.from(0)
  );

  useEffect(() => {
    if (!library || !account || !chainId) return;
    setAccountAddress(accountAddress || account);
    (async () => {
      setBalance(await library.getBalance(account));
    })();
  }, [library, account, chainId]);

  const switchToRinkeby = async () => {
    if (library?.provider.request) {
      library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4' }]
      });
    }
  };

  return (
    <ConnectAlert>
      <Container maxW="container.xl" minHeight="70vh" pb={12}>
        {nftsLoading && (
          <Alert status="info" variant="black">
            <AlertTitle>loading</AlertTitle>
          </Alert>
        )}

        {!nftsLoading && chainId && nfts.length === 0 && (
          <Alert status="info" overflow="visible" variant="black">
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
                <MintButton onMinted={onNFTAdded} balance={balance} />
              )}
            </Flex>
          </Alert>
        )}

        {chainId && (
          <>
            <Flex direction="row" align="center" justify="space-between">
              {nfts.length > 0 && (
                <Heading size="md" flex={3}>
                  Choose an NFT to splice
                </Heading>
              )}
            </Flex>
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
                  <MintButton onMinted={onNFTAdded} balance={balance} />
                </Flex>
              )}
              {indexer?.canBeContinued() && (
                <Flex width="100%" minH="80" align="center" justify="center">
                  <Button
                    onClick={continueLoading}
                    disabled={nftsLoading}
                    isLoading={nftsLoading}
                  >
                    load more
                  </Button>
                </Flex>
              )}
            </SimpleGrid>
          </>
        )}
      </Container>

      <Flex background="gray.300" py={6}>
        <Container maxW="container.lg">
          <Heading size="lg" mb={6} color="gray.700">
            Can't find your NFT?{' '}
          </Heading>
          <Text fontSize="md">Try pasting any marketplace link here</Text>
          <Flex flex={2} direction="column">
            <ImportNFT
              onNFTFragment={({
                collection,
                tokenId
              }: {
                collection: string;
                tokenId: string;
              }) => {
                history.push(`/nft/${collection}/${tokenId}`);
              }}
            />
          </Flex>
        </Container>
      </Flex>
    </ConnectAlert>
  );
};
