import { useWeb3React } from '@web3-react/core';
import React, { useState } from 'react';
import { providers } from 'ethers';
import {
  Box,
  Button,
  Image,
  SimpleGrid,
  Flex,
  Heading,
  Spacer,
  Text
} from '@chakra-ui/react';
import axios from 'axios';
import { getNFTs } from '../../modules/nftport';
import { NFTItem } from '../../types/NFTPort';
import { truncateAddress } from '../../modules/strings';

export const NFTCard = ({ nft }: { nft: NFTItem }) => {
  if (!nft.metadata) return <></>;

  const { image, image_url } = nft.metadata;

  let imgSrc = image ? image : image_url;

  if (imgSrc?.startsWith('ipfs://')) {
    imgSrc = imgSrc.replace('ipfs://', 'http://ipfs.io/');
  }
  return (
    <Flex
      rounded="2xl"
      minH="80"
      direction="column"
      overflow="hidden"
      _hover={{
        transform: 'translate(0, -3px)',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 10px 20px 10px'
      }}
      style={{ transition: 'all ease .3s' }}
      boxShadow="rgba(0, 0, 0, 0.05) 0px 10px 20px 0px"
      justify="space-between"
    >
      <Image
        src={imgSrc}
        title={imgSrc}
        boxSize="fit-content"
        objectFit="cover"
        alt={imgSrc}
        fallbackSrc="https://via.placeholder.com/800"
      />
      <Box p={4}>
        <Heading size="lg">{nft.metadata?.name}</Heading>
      </Box>
      <Flex background="black" direction="row" p={6}>
        <Flex direction="column">
          <Text color="gray.200" fontWeight="bold">
            contract
          </Text>
          <Text color="white">{truncateAddress(nft.contract_address)}</Text>
        </Flex>
        <Spacer />
        <Button variant="solid">Mint</Button>
      </Flex>
    </Flex>
  );
};

export const NFTList = ({ nfts }: { nfts: NFTItem[] }) => {
  return (
    <SimpleGrid columns={[2, null, 3]} spacingX="40px" spacingY="20px">
      {nfts.map((nft) => (
        <NFTCard key={`${nft.contract_address}/${nft.token_id}`} nft={nft} />
      ))}
    </SimpleGrid>
  );
};

const MyAssets = () => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const [nfts, setNFTs] = useState<NFTItem[]>();

  const fetchAssets = async () => {
    if (!account) return;
    const _nfts = await getNFTs({ address: account, chain: 'ethereum' });

    setNFTs(_nfts.filter((n) => n.metadata !== null));
  };

  return (
    <>
      {nfts ? (
        <NFTList nfts={nfts} />
      ) : (
        <Button onClick={fetchAssets}>get my assets</Button>
      )}
    </>
  );
};

export default MyAssets;
