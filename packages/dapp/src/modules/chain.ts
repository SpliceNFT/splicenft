import axios from 'axios';
import { ethers } from 'ethers';

import { NFTItem, NFTMetaData } from '@splicenft/common';

export const CHAINS: Record<number, ChainOpt> = {
  1: 'ethereum',
  4: 'rinkeby',
  42: 'kovan',
  31337: 'localhost'
};

export type ChainOpt = 'ethereum' | 'rinkeby' | 'kovan' | 'localhost';

const localContracts = process.env
  .REACT_APP_TESTNETNFT_CONTRACT_ADDRESS as string;

const knownContracts: Record<ChainOpt, string[]> = {
  ethereum: [],
  rinkeby: [
    '0xF5aa8981E44a0F218B260C99F9C89Ff7C833D36e', //CC
    '0xe85C716577A58d637ddA647caf42Bc5a6cBA2e95' //SSS
  ],
  kovan: [
    '0x6334d2cbC3294577BB9de58e8b1901d6e3b97681', //CC
    '0x6d96aAE79399C6f2630d585BBb0FCF31cCa88fa9', //BAYC
    '0xbC7708B459CAF31DA418f7F07AF89671CdB8c12C' //DEADFELLAZ
  ],
  localhost: localContracts.split(',')
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
  },
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

const getAsset = async (c: ethers.Contract, tokenId: string) => {
  let tokenUrl: string = await c.tokenURI(tokenId);
  if (tokenUrl.startsWith('ipfs://')) {
    tokenUrl = tokenUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  let metaData: NFTMetaData;
  try {
    metaData = (
      await axios.get<NFTMetaData>(tokenUrl, {
        responseType: 'json'
      })
    ).data;
  } catch (e) {
    const res = await axios.get<NFTMetaData>(
      process.env.REACT_APP_CORS_PROXY as string,
      {
        params: {
          url: tokenUrl
        },
        responseType: 'json'
      }
    );
    metaData = res.data;
  }

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
): Promise<Array<NFTItem | null>> => {
  const bal = await c.balanceOf(ownerAddress);
  const promises = [];
  for (let i = 0; i < bal; i++) {
    promises.push(
      (async () => {
        const tokenId = await c.tokenOfOwnerByIndex(ownerAddress, i);
        try {
          return await getAsset(c, tokenId);
        } catch (e) {
          console.log(`failed loading asset ${c.address}/${tokenId}`);
          return null;
        }
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
  const onlyWorkingAssets = <NFTItem[]>(
    items.flatMap((i) => i).filter((i) => i != null)
  );

  return onlyWorkingAssets;
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

export const mintAsset = async ({
  collection,
  signer
}: {
  collection: string;
  signer: ethers.Signer;
}): Promise<number> => {
  const contract = new ethers.Contract(collection, ownerABI, signer);
  const address = await signer.getAddress();
  const tx = await contract.mint(address);
  const receipt = await tx.wait();
  const transferEvent = await receipt.events[0].decode();
  const tokenId = transferEvent.tokenId;
  return tokenId.toNumber();
};
