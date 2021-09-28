import axios from 'axios';
import { ethers } from 'ethers';
import { NFTItem, NFTMetaData } from '../types/NFTPort';

export const CHAINS: Record<number, ChainOpt> = {
  1: 'ethereum',
  4: 'rinkeby',
  31337: 'localhost'
};

export type ChainOpt = 'ethereum' | 'rinkeby' | 'localhost';

const knownContracts: Record<ChainOpt, string[]> = {
  ethereum: [],
  rinkeby: ['0xF5aa8981E44a0F218B260C99F9C89Ff7C833D36e'],
  localhost: [process.env.REACT_APP_TESTNETNFT_CONTRACT_ADDRESS as string]
};

const ownerABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256'
      }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const getAsset = async (c: ethers.Contract, tokenId: string) => {
  const tokenUrl = await c.tokenURI(tokenId);
  const metaData: NFTMetaData = (
    await axios.get<NFTMetaData>(tokenUrl, {
      responseType: 'json'
    })
  ).data;

  return {
    name: metaData.name,
    description: metaData.description,
    token_id: tokenId,
    contract_address: c.address,
    asset_url: tokenUrl,
    metadata: metaData
  };
};

const getNFTs = async (
  c: ethers.Contract,
  ownerAddress: string
): Promise<NFTItem[]> => {
  const bal = await c.balanceOf(ownerAddress);
  const promises = [];
  for (let i = 0; i < bal; i++) {
    promises.push(
      (async () => {
        const tokenId = await c.tokenOfOwnerByIndex(ownerAddress, i);
        return await getAsset(c, tokenId);
      })()
    );
  }
  return await Promise.all(promises);
};

export const getAllAssetsOfOwner = async ({
  ownerAddress,
  provider,
  chain = 'ethereum'
}: {
  ownerAddress: string;
  provider: ethers.providers.BaseProvider;
  chain: ChainOpt;
}): Promise<NFTItem[]> => {
  const contracts = knownContracts[chain].map(
    (contractAddress) =>
      new ethers.Contract(contractAddress, ownerABI, provider)
  );
  const items = await Promise.all(
    contracts.map((c: ethers.Contract) => getNFTs(c, ownerAddress))
  );
  return items.flatMap((i) => i);
};

export const getNFT = async ({
  collection,
  tokenId,
  provider
}: {
  collection: string;
  tokenId: string;
  provider: ethers.providers.BaseProvider;
}): Promise<NFTItem> => {
  const contract = new ethers.Contract(collection, ownerABI, provider);

  const item = await getAsset(contract, tokenId);

  return item;
};
