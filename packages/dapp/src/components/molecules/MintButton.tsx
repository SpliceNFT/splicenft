import { Button } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CHAINS, getKnownNFTs, mintNFT } from '../../modules/chain';

export const MintButton = ({
  onMinted
}: {
  onMinted: (collection: string, tokenId: string) => void;
}) => {
  const { library, account, chainId } = useWeb3React<providers.Web3Provider>();
  const [mintableNFTs, setMintableNFTs] = useState<string[]>([]);

  useEffect(() => {
    if (!chainId) return;
    setMintableNFTs(getKnownNFTs(CHAINS[chainId]));
  }, [chainId]);

  const mintTestnetNFT = async () => {
    if (!library) return;

    const tokenId = await mintNFT({
      collection: mintableNFTs[0],
      signer: library.getSigner()
    });
    onMinted(mintableNFTs[0], `${tokenId}`);
  };

  return (
    <Button variant="black" onClick={mintTestnetNFT}>
      mint a testnet NFT
    </Button>
  );
};
