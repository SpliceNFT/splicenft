import {
  Alert,
  AlertDescription,
  AlertTitle,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
  Flex,
  SimpleGrid,
  useToast
} from '@chakra-ui/react';
import { NFTItemInTransit } from '@splicenft/common';
import { NavLink } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSplice } from '../../context/SpliceContext';
import { MintButton } from '../molecules/MintButton';
import { NFTCard } from '../molecules/NFTCard';

export const MyAssetsPage = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { indexer } = useSplice();

  const [loading, setLoading] = useState<boolean>(false);

  const [nfts, setNFTs] = useState<NFTItemInTransit[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (!account || !indexer) return;

    (async () => {
      try {
        setLoading(true);
        //todo: either use global state or cache the assets somehow.
        setNFTs(await indexer.getAllAssetsOfOwner(account));
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
  }, [account, indexer]);

  const onNFTMinted = async (collection: string, tokenId: string) => {
    if (!library || !indexer) return;
    const newMetadata = await indexer.getAssetMetadata(collection, tokenId);

    if (newMetadata) {
      setNFTs([
        ...nfts,
        {
          contract_address: collection,
          token_id: tokenId,
          metadata: newMetadata
        }
      ]);
    }
  };

  return (
    <Container maxW="container.xl" minHeight="70vh" pb={12}>
      <Breadcrumb>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink as={NavLink} to="/my-assets">
            Your Assets
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      {loading ? (
        'loading'
      ) : nfts.length === 0 ? (
        <Alert status="info" overflow="visible" mt={6}>
          <Flex
            align="center"
            direction="row"
            justify="space-between"
            width="100%"
          >
            <AlertTitle>
              {chainId
                ? `it seems you don't have any assets on chain ${chainId}`
                : `please connect with an Ethereum account (Rinkeby works best atm)`}
            </AlertTitle>
            <AlertDescription>
              {chainId && chainId !== 1 && (
                <MintButton onMinted={onNFTMinted} />
              )}
            </AlertDescription>
          </Flex>
        </Alert>
      ) : (
        <SimpleGrid columns={[1, 2, 3, 4]} spacingX={5} spacingY="20px" mt={6}>
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
              <MintButton onMinted={onNFTMinted} />
            </Flex>
          )}
        </SimpleGrid>
      )}
    </Container>
  );
};
