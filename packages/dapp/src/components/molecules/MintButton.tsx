import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { CHAINS } from '@splicenft/common';
import { knownCollections } from '../../modules/chains';
import { Contract, BigNumber } from 'ethers';

const MintingABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      }
    ],
    name: 'mint',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
];

export const MintButton = ({
  onMinted
}: {
  onMinted: (collection: string, tokenId: string) => void;
}) => {
  const { library, account, chainId } = useWeb3React<providers.Web3Provider>();
  const [mintableNFTs, setMintableNFTs] = useState<string[]>([]);

  useEffect(() => {
    if (!chainId) return;
    setMintableNFTs(knownCollections[CHAINS[chainId]]);
  }, [chainId]);

  const mintTestnetNFT = async (collection: string) => {
    if (!library) return;
    const signer = library?.getSigner();
    const contract = new Contract(collection, MintingABI, signer);
    const tx = await contract.mint(account);
    const receipt = await tx.wait();

    //todo use typechain here
    // console.log(transferEvent);
    // const tokenId = transferEvent.tokenId;
    const tokenId: BigNumber = await receipt.events[0].args['tokenId'];

    onMinted(collection, `${tokenId.toNumber()}`);
  };

  return (
    <Menu enabled={mintableNFTs.length > 0}>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="black">
        mint a testnet NFT
      </MenuButton>
      <MenuList>
        {mintableNFTs.map((addr) => (
          <MenuItem key={`mint-${addr}`} onClick={() => mintTestnetNFT(addr)}>
            {addr}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
