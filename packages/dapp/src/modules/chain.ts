import axios from 'axios';
import { ethers } from 'ethers';
import { NFTItem, NFTMetaData, NftPortAccountResponse } from '../types/NFTPort';

const BASE_URI = `https://api.nftport.xyz`;

type ChainOpt = 'ethereum' | 'rinkeby';

const knownContracts: Record<ChainOpt, string[]> = {
  ethereum: [],
  rinkeby: ['0xF5aa8981E44a0F218B260C99F9C89Ff7C833D36e']
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

const getAllAssets = async (
  c: ethers.Contract,
  address: string
): Promise<NFTItem[]> => {
  const bal = await c.balanceOf(address);
  const promises = [];
  for (let i = 0; i < bal; i++) {
    promises.push(
      (async () => {
        const tokenId = await c.tokenOfOwnerByIndex(address, i);
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
      })()
    );
  }
  return await Promise.all(promises);
};

export const getNFTs = async ({
  address,
  provider,
  chain = 'ethereum'
}: {
  address: string;
  provider: ethers.providers.BaseProvider;
  chain: ChainOpt;
}): Promise<NFTItem[]> => {
  const contracts = knownContracts[chain].map(
    (contractAddress) =>
      new ethers.Contract(contractAddress, ownerABI, provider)
  );
  const items = await Promise.all(
    contracts.map((c: ethers.Contract) => getAllAssets(c, address))
  );
  return items.flatMap((i) => i);
};
