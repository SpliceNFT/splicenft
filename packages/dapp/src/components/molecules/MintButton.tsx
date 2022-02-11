import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  Link,
  MenuList,
  useToast
} from '@chakra-ui/react';
import { OnChain } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSplice } from '../../context/SpliceContext';

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

type MintableCollection = { name: string; address: string };

export const MintButton = ({
  onMinted,
  balance
}: {
  onMinted: (collection: string, tokenId: string) => void;
  balance: ethers.BigNumber | undefined;
}) => {
  const { indexer } = useSplice();
  const { library, account } = useWeb3React<providers.Web3Provider>();
  const [buzy, setBuzy] = useState<boolean>(false);

  const [mintableNFTs, setMintableNFTs] = useState<MintableCollection[]>([]);
  const toast = useToast();
  useEffect(() => {
    if (!indexer) return;
    if (!(indexer instanceof OnChain)) return;
    (async () => {
      setMintableNFTs(
        await Promise.all(
          indexer
            .getCollections()
            .filter(
              (erc) =>
                erc.address !== '0xF5aa8981E44a0F218B260C99F9C89Ff7C833D36e'
            )
            .map((erc721) => {
              return new Promise<MintableCollection>((resolve, rej) => {
                erc721.name().then((name) =>
                  resolve({
                    name,
                    address: erc721.address
                  })
                );
              });
            })
        )
      );
    })();
  }, [indexer]);

  const mintTestnetNFT = async (collection: string) => {
    if (!library) return;
    setBuzy(true);
    try {
      const signer = library?.getSigner();
      const contract = new Contract(collection, MintingABI, signer);
      const tx = await contract.mint(account);
      const receipt = await tx.wait();

      //todo use typechain here
      // console.log(transferEvent);
      // const tokenId = transferEvent.tokenId;
      const tokenId: BigNumber = await receipt.events[0].args['tokenId'];

      onMinted(collection, `${tokenId.toNumber()}`);
    } catch (e: any) {
      toast({
        status: 'error',
        isClosable: true,
        title: e.message || 'minting failed'
      });
    }
    setBuzy(false);
  };

  if (!balance || balance.isZero()) {
    return (
      <Button
        as={Link}
        href="https://faucet.paradigm.xyz/"
        isExternal
        variant="white"
      >
        get testnet eth
      </Button>
    );
  } else {
    return (
      <Menu>
        <MenuButton
          disabled={buzy || mintableNFTs.length == 0}
          boxShadow="md"
          isLoading={buzy}
          loadingText="Minting"
          as={Button}
          rightIcon={<ChevronDownIcon />}
          variant="black"
        >
          mint a testnet NFT
        </MenuButton>
        <MenuList>
          {mintableNFTs.map((mintableCollection) => (
            <MenuItem
              key={`mint-${mintableCollection.address}`}
              onClick={() => mintTestnetNFT(mintableCollection.address)}
            >
              {mintableCollection.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  }
};
