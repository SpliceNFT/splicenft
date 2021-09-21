import { useWeb3React } from '@web3-react/core';
import React, { useState } from 'react';
import { providers } from 'ethers';
import { Button, SimpleGrid, Flex, Heading } from '@chakra-ui/react';
import axios from 'axios';
import { getNFTs } from '../../modules/nftport';
import { NFTItem } from '../../types/NFTPort';

export const NFTList = ({ nfts }: { nfts: NFTItem[] }) => {
  console.log(nfts);

  return (
    <SimpleGrid columns={[2, null, 3]} spacingX="40px" spacingY="20px">
      {nfts.map((nft) => (
        <Flex key={`${nft.contract_address}/${nft.token_id}`}>
          <Heading>f{nft.name}</Heading>
        </Flex>
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
    setNFTs(_nfts);
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
